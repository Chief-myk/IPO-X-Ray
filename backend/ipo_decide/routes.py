"""HTTP routes for the decision desk, mounted by main.py under /api/decide."""
import asyncio
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field, model_validator

from . import allotment, apply_plan, history, listing, rules, sell_timing

router = APIRouter(prefix="/api/decide", tags=["decision desk"])
Board = Literal["SME", "MAINBOARD"]
MAX_UPLOAD = 5 * 1024 * 1024


class Range(BaseModel):
    lo: float
    median: float
    hi: float

    @model_validator(mode="after")
    def ordered(self):
        if not self.lo <= self.median <= self.hi:
            raise ValueError("Range must satisfy low <= median <= high.")
        return self


class ListingIn(BaseModel):
    board: Board
    issue_price: float | None = Field(None, gt=0)
    issue_size_cr: float | None = Field(None, gt=0)
    sub_retail: float | None = Field(None, ge=0)
    sub_nii: float | None = Field(None, ge=0)
    sub_qib: float | None = Field(None, ge=0)
    sub_total: float | None = Field(None, ge=0)
    gmp_pct: float | None = Field(None, ge=-100, le=500)
    gmp_rs: float | None = None
    market_ret_20d: float | None = Field(None, ge=-50, le=50)
    auto_market: bool = True


class OddsIn(BaseModel):
    board: Board
    subscription: float = Field(..., gt=0)
    lot_size: int = Field(..., gt=0)
    price: float = Field(..., gt=0)
    lots_applied: int | None = Field(None, gt=0)
    applications: int | None = Field(None, gt=0)
    reserved_shares: int | None = Field(None, gt=0)
    accounts: int = Field(1, ge=1, le=6)


class PlanIpo(BaseModel):
    name: str = Field(..., max_length=80)
    board: Board
    price: float = Field(..., gt=0)
    lot_size: int = Field(..., gt=0)
    open_date: str | None = None
    close_date: str
    listing_date: str | None = None
    expected_subscription: float = Field(..., gt=0)
    applications: int | None = Field(None, gt=0)
    reserved_shares: int | None = Field(None, gt=0)
    gain_range: Range | None = None
    issue_size_cr: float | None = Field(None, gt=0)
    sub_retail: float | None = Field(None, ge=0)
    sub_nii: float | None = Field(None, ge=0)
    sub_qib: float | None = Field(None, ge=0)
    sub_total: float | None = Field(None, ge=0)
    gmp_pct: float | None = None
    market_ret_20d: float | None = None


class PlanIn(BaseModel):
    budget: float = Field(..., gt=0)
    accounts: int = Field(1, ge=1, le=6)
    objective: Literal["expected", "cautious"] = "expected"
    apply_on: Literal["last_day", "first_day"] = "last_day"
    surcharge: float = Field(0.0, ge=0, le=0.15)
    ipos: list[PlanIpo] = Field(..., min_length=1, max_length=apply_plan.MAX_IPOS)


class SellIn(BaseModel):
    board: Board
    issue_price: float = Field(..., gt=0)
    shares: int = Field(..., gt=0)
    allotment_date: str | None = None
    listing_date: str | None = None
    symbol: str | None = Field(None, max_length=40)
    current_price: float | None = Field(None, gt=0)
    gain_range: Range | None = None
    model_inputs: ListingIn | None = None
    daily_vol_pct: float | None = Field(None, gt=0, le=20)
    drift_annual_pct: float = Field(0.0, ge=-80, le=200)
    alt_return_pct: float = Field(7.0, ge=0, le=30)
    surcharge: float = Field(0.0, ge=0, le=0.15)
    ltcg_exemption_left: float | None = Field(None, ge=0)
    brokerage: float = Field(0.0, ge=0)


def _check_dates(*ds):
    for d in ds:
        if d and not history.parse_date(d):
            raise HTTPException(400, f"Could not read the date '{d}'. Use YYYY-MM-DD.")


@router.get("/rules")
def get_rules():
    return rules.public()


@router.get("/model")
async def model_card():
    m = await asyncio.to_thread(listing.get_model)
    return {"card": m["card"], "history": history.stats()}


@router.post("/model/train")
async def model_train():
    return {"card": await asyncio.to_thread(listing.train), "history": history.stats()}


@router.post("/history/import")
async def history_import(file: UploadFile = File(...), board: Board | None = Form(None), source: str = Form("")):
    data = await file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(400, "File is larger than 5 MB.")
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(400, "Upload a .csv file.")
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / "upload.csv"
        path.write_bytes(data)
        try:
            out = await asyncio.to_thread(history.import_csv, str(path), board, source or file.filename)
        except (UnicodeDecodeError, ValueError) as exc:
            raise HTTPException(400, f"Could not read that CSV: {exc}")
    if out["missing_required"]:
        out["warning"] = "Missing columns: " + ", ".join(out["missing_required"]) + ". Rows without them were skipped."
    out["card"] = (await asyncio.to_thread(listing.get_model, True))["card"] if out["added"] else None
    return out


def _with_market(d: dict) -> dict:
    if d.pop("auto_market", False) and d.get("market_ret_20d") is None:
        try:
            d["market_ret_20d"] = history.nifty_ret_20d()
        except Exception:
            d["market_ret_20d"] = None
    return d


@router.post("/listing")
async def listing_range(body: ListingIn):
    d = await asyncio.to_thread(_with_market, body.model_dump())
    return await asyncio.to_thread(listing.predict, d)


@router.post("/odds")
def odds(body: OddsIn):
    o = allotment.odds(board=body.board, subscription=body.subscription, lot_size=body.lot_size, price=body.price,
                       lots_applied=body.lots_applied, applications=body.applications, reserved_shares=body.reserved_shares)
    if not o.get("ok"):
        raise HTTPException(400, o.get("error"))
    o["accounts"] = body.accounts
    o["p_any_account"] = round(allotment.across_accounts(o["p_win"], body.accounts), 5)
    return o


@router.post("/plan")
async def plan(body: PlanIn):
    for i in body.ipos:
        _check_dates(i.open_date, i.close_date, i.listing_date)
    ipos = [{**i.model_dump(), "gain_range": i.gain_range.model_dump() if i.gain_range else None} for i in body.ipos]
    if any(i["market_ret_20d"] is None and not i["gain_range"] for i in ipos):
        mkt = (await asyncio.to_thread(_with_market, {"auto_market": True}))["market_ret_20d"]
        for i in ipos:
            i["market_ret_20d"] = mkt if i["market_ret_20d"] is None else i["market_ret_20d"]
    out = await asyncio.to_thread(apply_plan.plan, budget=body.budget, ipos=ipos, accounts=body.accounts,
                                  objective=body.objective, apply_on=body.apply_on, surcharge=body.surcharge)
    if not out["ok"]:
        raise HTTPException(400, out["error"])
    return out


@router.post("/sell")
async def sell(body: SellIn):
    _check_dates(body.allotment_date, body.listing_date)
    args = body.model_dump()
    args["gain_range"] = body.gain_range.model_dump() if body.gain_range else None
    mi = args.pop("model_inputs")
    if mi:
        mi = await asyncio.to_thread(_with_market, mi)
        mi.pop("board", None)
    args["model_inputs"] = mi
    args["symbol"] = (body.symbol or "").strip() or None
    out = await asyncio.to_thread(lambda: sell_timing.analyse(**args))
    if not out["ok"]:
        raise HTTPException(400, out["error"])
    return out
