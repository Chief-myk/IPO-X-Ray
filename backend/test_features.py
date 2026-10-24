"""Comprehensive automated tests for IPO X-Ray 360 features.
Tests Agent Debate, Investment Simulator, IPO Promise Tracker, RAG Chatbot, and Database.
"""
import asyncio
import unittest
import database
import debate
import promise_tracker
import rag_chatbot
import simulator


class TestIPOXRayFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        database.init_db()

    def test_database_init(self):
        """Test SQLite tables are initialized and benchmark promises exist."""
        promises = database.get_promises()
        self.assertGreater(len(promises), 0, "Initial seed promises should be loaded")
        kalindi_promises = database.get_promises(company="Kalindi Smart Mobility Limited")
        self.assertGreaterEqual(len(kalindi_promises), 4, "Kalindi should have at least 4 commitments")

    def test_agent_debate_generation(self):
        """Test Bull vs Bear debate and Impartial Judge balanced synthesis."""
        result = asyncio.run(debate.generate_debate("Kalindi Smart Mobility Limited"))
        self.assertIn("id", result)
        self.assertIn("bull_case", result)
        self.assertIn("bear_case", result)
        self.assertIn("judge_verdict", result)
        self.assertIn("citations", result)

        bull = result["bull_case"]
        bear = result["bear_case"]
        judge = result["judge_verdict"]

        self.assertTrue(len(bull.get("arguments", [])) >= 2, "Bull case must have at least 2 arguments")
        self.assertTrue(len(bear.get("arguments", [])) >= 2, "Bear case must have at least 2 arguments")
        self.assertTrue(len(judge.get("contradictions", [])) >= 1, "Judge must identify contradictions")
        self.assertTrue(len(judge.get("unanswered_questions", [])) >= 1, "Judge must list unanswered questions")
        self.assertTrue(len(result["citations"]) >= 1, "Debate must have verifiable citations")

        # Verify persisted in database
        saved = database.get_latest_debate("Kalindi Smart Mobility Limited")
        self.assertIsNotNone(saved)
        self.assertEqual(saved["id"], result["id"])

    def test_investment_simulator_calculations(self):
        """Test simulator calculations for best, base, and worst case scenarios."""
        sim = simulator.calculate_simulation("Kalindi Smart Mobility Limited", 20000.0, 12)
        self.assertEqual(sim["investment_amount"], 20000.0)
        self.assertEqual(sim["horizon_months"], 12)
        self.assertIn("best_case", sim)
        self.assertIn("base_case", sim)
        self.assertIn("worst_case", sim)
        self.assertIn("expected_value", sim)

        best = sim["best_case"]
        base = sim["base_case"]
        worst = sim["worst_case"]

        self.assertGreater(best["final_value_inr"], 0)
        self.assertGreater(base["final_value_inr"], 0)
        self.assertGreaterEqual(worst["final_value_inr"], 0)

        # Worst-case loss should be negative for a high-risk company
        self.assertLess(worst["gain_loss_inr"], 0, "Worst-case should show loss for high-risk company")

        # Probability weights must sum to approximately 1.0
        prob_sum = best["probability_weight"] + base["probability_weight"] + worst["probability_weight"]
        self.assertAlmostEqual(prob_sum, 1.0, places=2)

        # Assumptions and disclaimers must be present
        self.assertIn("disclaimer", sim["assumptions"])
        self.assertIn("methodology", sim["assumptions"])

    def test_promise_tracker_statuses_and_alerts(self):
        """Test IPO Promise Tracker status distinctions (Met, Partially Met, Missed, Unverified)."""
        promises = promise_tracker.get_all_promises(company="Kalindi Smart Mobility Limited")
        statuses = {p["status"] for p in promises}
        self.assertIn("Missed", statuses, "Should include Missed promises")
        self.assertIn("Partially Met", statuses, "Should include Partially Met promises")
        self.assertIn("Unverified", statuses, "Should include Unverified promises")

        # Alerts query
        alerts = promise_tracker.get_active_alerts(company="Kalindi Smart Mobility Limited")
        self.assertGreater(len(alerts), 0, "Critical and warning alerts should be triggered")

        # Test verification helper
        sample_promise_id = promises[0]["id"]
        updated = asyncio.run(promise_tracker.verify_commitment(
            sample_promise_id,
            "Company failed to deploy capital to the plant. Project has been suspended.",
            "Statutory Auditor Note 2026"
        ))
        self.assertIn(updated["status"], ["Missed", "Partially Met", "Met", "Unverified"])
        self.assertEqual(updated["evidence_source"], "Statutory Auditor Note 2026")

    def test_rag_chatbot_context_and_honesty(self):
        """Test RAG Chatbot cites evidence and admits missing info instead of hallucinating."""
        # 1. Answer question about known red flags
        resp = asyncio.run(rag_chatbot.chat_with_copilot(
            session_id="test_unit_session",
            message="What are the biggest vendor red flags for Kalindi?",
            company="Kalindi Smart Mobility Limited"
        ))
        self.assertIn("Vyom Signal", resp["content"], "Answer should mention Vyom Signal from context")
        self.assertGreater(len(resp["citations"]), 0, "Answer must include citations")

        # 2. Test multi-turn conversation memory
        history = database.get_chat_history("test_unit_session")
        self.assertGreaterEqual(len(history), 2, "Conversation history should record user and assistant turns")

        # 3. Test honesty on missing/unregulated info
        resp_missing = asyncio.run(rag_chatbot.chat_with_copilot(
            session_id="test_unit_session_2",
            message="What is the current gray market premium (GMP) and informal price?",
            company="Kalindi Smart Mobility Limited"
        ))
        self.assertTrue(
            "not disclosed" in resp_missing["content"].lower() or "avoid" in resp_missing["content"].lower(),
            "Bot must explicitly state information is not disclosed instead of fabricating GMP"
        )


if __name__ == "__main__":
    unittest.main()
