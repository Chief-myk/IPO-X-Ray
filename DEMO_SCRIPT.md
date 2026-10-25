# IPO X-Ray: demo script for judges

Har feature ke liye ek tested case hai. Saare cases 25 Oct 2026 ko is laptop par chala kar check kiye gaye. Inme se
koi bhi TinyFish credits ya internet par AI service nahi maangta (sirf Yahoo Finance se prices aate hain).

Poora demo: ~10 minute. Time kam ho to sirf ⭐ wale cases dikhao.

---

## Demo se pehle (5 minute pehle)

1. **Ollama chalu karo:** Ollama app kholo (menu bar mein llama icon dikhna chahiye). Check karne ke liye:
   ```bash
   curl -s localhost:11434/api/tags
   ```
   Agar kuch print hota hai, to Ollama chal raha hai.
2. **App start karo** (ek hi server, frontend bhi isi se khulta hai):
   ```bash
   cd ~/Desktop/ipo-xray/backend && .venv/bin/uvicorn main:app --port 8000
   ```
   Browser mein kholo: **http://localhost:8000**
3. **AI model garam karo:** AI Copilot (neeche-right button) mein ek sawaal pucho, jaise "What is this IPO?".
   Pehla jawab 20-30 second leta hai kyunki model memory mein load hota hai. Uske baad jawab jaldi aate hain.
4. **Bull vs Bear pehle se bana ke rakho:** Toolkit → Bull vs Bear kholo aur ek baar "Trafiksol ITS Technologies"
   chip dabao. Local model ko ~60 second lagte hain, isliye judges ke saamne wait na karna pade.

### ⚠️ Ye buttons demo mein MAT dabana (TinyFish chalate hain: credits lagte hain, 5-10 minute lag sakte hain)
- Home ya Investigate par **"Start investigation"** aur company chips (Kalindi / Trafiksol / Resourceful)
- X-Ray mein **"Run TinyFish agents"** aur vendor ka **"Check this vendor"**
- Live watch mein **"Re-run checks now"**
- Truth vs Hype mein **"Collect public calls"**
- Claim autopsy mein **"check official records with agents"** checkbox ✅ (default ON hai, **untick karna hai**)

Sirf **"Run the sample case"** wala investigation chalao.

---

## 1. ⭐ Fraud investigation (main feature) · ~2 min

**Kya dikhata hai:** DRHP ke har claim ko AI agents web par verify karte hain, aur ML model risk score deta hai.

**Steps:**
1. Top menu → **Investigate** → **"Run the sample case"** dabao.
2. ~20 second mein agents ki live lanes chalti dikhengi (claims "checking" → result).
3. Neeche **Verdict** aata hai: **"High risk"**, score **99/100**.

**Kya point out karna hai:**
- Har red flag ke saath source hai, aur ML model batata hai ki kaunse signal ne score kitna badhaya
  (Shapley values, "Gradient-boosted model" box).
- Example flag: main vendor ka director aur promoter ek hi address par, vendor ki website kuch hafte purani.

**Bolna:** "Sample case ek fictional company hai jo asli SEBI cases ke pattern par bani hai. Live mode mein yahi
agents TinyFish se asli web par chalte hain."

---

## 2. ⭐ X-Ray: promoter network (asli SEBI case) · ~1.5 min

**Case:** Trafiksol ITS Technologies. SEBI ne Dec 2024 mein iska IPO cancel karke refund order kiya tha, kyunki
software vendor ek shell company thi.

**Steps:**
1. Toolkit → **X-Ray** → **Promoter network** tab.
2. Search box mein **Trafiksol ITS Technologies** pehle se likha hota hai → **"Show network"** dabao.
3. Network map mein kisi node par click karo → right side mein uski details aur source aate hain.
4. **Vendor scorecards** tab: Oasis Corpcare Pvt Ltd (wo vendor jise SEBI ne shell entity kaha).
5. **Live watch** tab → **"Simulate a change (demo)"** dabao → nayi alert aati hai.

**Kya point out karna hai:** company, directors, vendor aur addresses ka graph. Har fact ke saath source URL aur
fetch date hai.

**Dhyan rakhna:** vendor scorecard "Not checked yet" dikhata hai, kyunki uska check TinyFish se hota hai. Live
watch ki alerts par "SIMULATED" likha hai; judges ko bata dena ki ye demo trigger hai, asli finding nahi.

---

## 3. Promise Tracker · ~1 min

**Kya dikhata hai:** DRHP mein kiye gaye promises vs listing ke baad ki filings mein kya hua.

**Steps:**
1. Toolkit → **Promise Tracker**.
2. Upar **Active deviation & escalation alerts** dikhte hain (Kalindi ke promises: factory capex, etc.).
3. Kisi promise card par **"Audit with New Disclosure"** dabao aur ye paste karo:
   - Disclosure text: `Annual Report FY2026: Of the Rs 18.50 crore earmarked for the automated controller facility, Rs 6.20 crore has been spent so far. The facility is not yet commissioned and the balance is parked in fixed deposits.`
   - Source: `Annual Report FY2026 p. 42`
4. ~10-20 second mein local AI status deta hai: **"Partially Met"**, warning ke saath.

**Dhyan rakhna:** audit promise ka status DB mein badal deta hai. Demo ke baad dobara karna ho to koi aur promise
card use karo.

---

## 4. Bull vs Bear (AI debate) · ~1 min

**Steps:**
1. Toolkit → **Bull vs Bear**.
2. Setup mein jo Trafiksol debate pehle se banaya tha, wo dikhao: Bull ka case, Bear ka case, aur Judge ka verdict
   (contradictions, unanswered questions, risk verdict).

**Bolna:** "Teeno agents ek local AI model (Ollama, qwen3) par chalte hain. Koi API key nahi, data laptop se
bahar nahi jaata."

---

## 5. ⭐ Listing gain range (real data, ML) · ~1.5 min

**Case A, feature dikhane ke liye:** Decide → Listing range → **"Hot SME issue"** dabao → **"Get the listing range"**.

**Case B, asli IPO:** **Adcounty Media India** (NSE SME, listed 4 July 2025). Ye values bharo:

| Field | Value |
|---|---|
| IPO name | Adcounty Media India |
| Board | SME |
| Issue price | 85 |
| Issue size (₹ crore) | 50.69 |
| Retail subscription | 229.37 |
| NII / HNI subscription | 556.19 |
| QIB subscription | 137.33 |
| Total subscription | 273.16 |
| GMP (₹) | 45 |

**"Get the listing range"** dabao. Result: **+31.7% se +82.4%, median +52.9%**. Asli listing-day open ₹130 tha,
yani **+52.9%**.

**Kya point out karna hai:**
- Ye ek number nahi, range deta hai, aur "listing below issue price" ka chance (4.8%) bhi.
- "Closest past listings" table: milte-julte asli IPOs aur unka asli result.
- Neeche likha hai: "its 80% range covered 83% of held-out listings."

**Honestly bolna:** "Model 200 asli IPOs (2021-2025) par trained hai. Hamare out-of-time test mein, yani 2025 ke
40 IPOs par jo training mein nahi the, iski 80% range ne 82.5% cases cover kiye. Adcounty un test IPOs mein se ek
tha. Ab app ka final model saare 200 par train hai, isliye table mein Adcounty khud bhi dikhta hai. Kuch IPOs miss
bhi hote hain, jaise Jainik Power Cables jo -25% khula."

**Dhyan rakhna:** is method mein "subscription half / double" se range nahi badalti, kyunki ye GMP-based method
hai. Judge puche to yahi batana.

---

## 6. Application planner · ~1 min

**Steps:**
1. Decide → **Application planner**. Teen example IPOs pehle se bhare hain, budget ₹3,00,000.
2. **"Make my plan"** dabao.

**Result:** "Example SME (hot)" aur "Example mainboard" mein **APPLY**, aur "Example weak issue" ko **SKIP** (expected
result after tax positive nahi). Expected profit ~+₹828. Har IPO ke allotment odds, aur paisa kab block / wapas hoga.

**Bolna:** "Ye lottery odds, taxes aur kitne din paisa block hoga, sab milakar batata hai ki kahan apply karna
worth hai."

---

## 7. Sell timing · ~1 min

**Steps:** Decide → **Sell timing** → "Allotted, not listed yet", Board **SME**, Issue price **120**, Shares
**2000**, Total subscription **150**, GMP ₹ **40** → **"Compare selling dates"**.

**Result:** best middle outcome **listing day close: +₹67,646 tax ke baad**. Chart dikhata hai ki 1, 3, 6 mahine ya
long-term tax tak rukne par kya hoga. 20,000 simulated price paths hain.

---

## 8. Shield: investor protection · ~2 min

**8a. ⭐ Claim autopsy (scam message)**
1. Toolkit → **Shield** → **Claim autopsy**.
2. **"Load a sample scam"** dabao.
3. **"check official records with agents" ko UNTICK karo.**
4. **"Run autopsy"** dabao.

Result: **7 scam patterns matched, 4 claims Contradicted** ("guaranteed listing gain", "confirmed allotment
through HNI quota", personal UPI). Neeche **"Report it"** se SEBI / 1930 cyber-crime complaint ka draft banta hai.

**8b. Truth vs hype (influencer track record)**
1. **Truth vs hype** tab → **"Load example"** → **"Read calls"** → **"Audit against real prices"**.

Result: 10 stock tips ko asli NSE prices se check karta hai. Sirf **44% tips mein paisa bana**, **22% targets hit
hue**. Saath mein Nifty se comparison.

**8c. Can I actually exit? (liquidity)**
1. **Can I actually exit?** tab → Stock symbol **DRONE-SM.NS**, Amount **240000** → **"Simulate my exit"**.

Result: ₹2.4 lakh bechne mein ~**4 trading din** lagenge (roz ke volume ka 31%), aur 20% girawat mein ~**₹37,402
(15.6%)** ka nuksaan. Bolna: "SME stocks mein khareedna aasaan hai, bechna nahi."

---

## 9. Investment simulator · ~30 sec

Toolkit → **Simulator** → company **Kalindi Smart Mobility Limited**, amount 15000, 12 months →
**"Recalculate Scenarios"**. Best, base aur worst case returns aate hain. High risk par "too risky to invest"
warning aur sound aati hai.

---

## 10. AI Copilot chatbot · ~30 sec

Neeche-right **AI Copilot** → pucho: **"What are the biggest red flags in this IPO?"**

Result (~20 sec): red flags ki list, har point ke saath source citation ([MCA-21 DIN Filings], [WHOIS Registry],
[DRHP p. 260]).

---

## Judges ke sawaal: data aur model (honest jawab)

Poori details: `datasets/REPORT.md`.

- **"Data real hai?"** Haan. `datasets/real_ipo_listings.csv` mein 200 asli IPOs hain, aur
  `datasets/real_risk_labels.csv` mein 66 SME IPOs (16 par SEBI ne fraud ya proceeds misuse ka order diya). Har row
  ke saath source URL hai. Synthetic rows sirf `risk_train_real_plus_synthetic.csv` mein hain, aur wahan har row par
  `synthetic=1` likha hai.
- **"Fraud model kitna accurate hai?"** Best retrained model 55% frauds pakadta hai, F1 0.38 (out of 1). Random guess
  ka PR-AUC 0.24 hota, model ka ~0.37 hai. Accuracy number headline nahi hai, kyunki "hamesha clean bolo" bhi 76%
  de deta hai.
- **"Itna kam kyun?"** SEBI ke ~2,300 orders search kiye, sirf 16 SME IPO fraud cases mile. Aur public pages se
  model ke 17 mein se sirf 3 features bhar paate hain. Agla kadam: listing se pehle ke agent snapshots.
- **"Listing model?"** 80% range ne 2025 ke held-out IPOs ka 82.5% cover kiya. "Gain positive hoga" ka F1 0.80 hai,
  jabki hamesha "positive" bolna 0.75 deta hai.
- **"Leakage?"** Jo features baad ki SEBI action khud bata dete (SEBI orders, court cases, complaints), unhe
  training se hataya. Synthetic data cross-validation ke har fold ke andar sirf training rows se banta hai.

## Agar kuch galat ho jaaye
- **AI jawab nahi de raha:** Ollama band hai. Ollama app kholo, phir dobara try karo. Tab tak features fallback
  (rule-based) jawab dete hain.
- **Page khaali hai:** server chal raha hai ya nahi dekho (step 2), phir page refresh karo.
- **Kuch bahut der se load ho raha hai:** shayad TinyFish wala button dab gaya. Page refresh karo aur sample case
  par wapas jao.
