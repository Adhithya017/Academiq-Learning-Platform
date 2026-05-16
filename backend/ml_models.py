import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score


class AIAnalytics:
    """
    AcademiQ AI Engine
    - LinearRegression → Predicts final performance score (regression)
    - RandomForestClassifier → Detects dropout risk level (3-class: Low/Medium/High)
    - Rule-based engine → Generates personalized recommendations
    """

    RISK_LABELS = {0: "Low", 1: "Medium", 2: "High"}
    RISK_THRESHOLDS = {"Low": 35.0, "Medium": 65.0, "High": 100.0}

    def __init__(self):
        self.performance_model = make_pipeline(StandardScaler(), LinearRegression())
        self.risk_model = make_pipeline(
            StandardScaler(), RandomForestClassifier(n_estimators=100, random_state=42)
        )
        self.is_trained = False
        self.perf_r2 = 0.0
        self.risk_accuracy = 0.0
        self.feature_importances = {}

    def _generate_dataset(self, n_samples: int = 1000):
        """Generates a realistic synthetic academic dataset."""
        np.random.seed(42)

        attendance = np.random.normal(78, 15, n_samples).clip(30, 100)
        past_scores = np.random.normal(72, 14, n_samples).clip(20, 100)
        assignment_ratio = np.random.normal(0.80, 0.15, n_samples).clip(0.1, 1.0)
        hours_studied = np.random.normal(18, 8, n_samples).clip(0, 50)
        quiz_avg = np.random.normal(70, 14, n_samples).clip(20, 100)

        X = np.column_stack([attendance, past_scores, assignment_ratio * 100, hours_studied, quiz_avg])

        # Performance score — weighted combination with noise
        y_perf = (
            0.30 * attendance +
            0.25 * past_scores +
            0.20 * (assignment_ratio * 100) +
            0.10 * hours_studied +
            0.15 * quiz_avg +
            np.random.randn(n_samples) * 4
        ).clip(0, 100)

        # Risk: based on inverse of attendance + scores
        raw_risk = 100 - (0.45 * attendance + 0.35 * past_scores + 0.20 * (assignment_ratio * 100))
        raw_risk = raw_risk + np.random.randn(n_samples) * 5

        # 3-class: 0=Low, 1=Medium, 2=High
        y_risk = np.where(raw_risk > 65, 2, np.where(raw_risk > 35, 1, 0))

        return X, y_perf, y_risk

    def train(self):
        """Train both models and record metrics."""
        X, y_perf, y_risk = self._generate_dataset(1000)
        X_train, X_test, yp_train, yp_test, yr_train, yr_test = train_test_split(
            X, y_perf, y_risk, test_size=0.2, random_state=42
        )

        self.performance_model.fit(X_train, yp_train)
        self.risk_model.fit(X_train, yr_train)

        # Metrics
        self.perf_r2 = r2_score(yp_test, self.performance_model.predict(X_test))
        risk_preds = self.risk_model.predict(X_test)
        self.risk_accuracy = accuracy_score(yr_test, risk_preds)

        # Feature importances from RandomForest
        features = ["Attendance", "Past Scores", "Assignments", "Study Hours", "Quiz Avg"]
        importances = self.risk_model.named_steps["randomforestclassifier"].feature_importances_
        self.feature_importances = dict(zip(features, [round(float(v), 4) for v in importances]))

        self.is_trained = True

    def _ensure_trained(self):
        if not self.is_trained:
            self.train()

    def predict(self, attendance: float, past_scores: float,
                assignments: float, hours: float, quiz_avg: float = None):
        """
        Returns predicted performance, dropout risk %, risk level, and confidence.
        """
        self._ensure_trained()

        if quiz_avg is None:
            quiz_avg = (past_scores + assignments) / 2.0

        features = np.array([[attendance, past_scores, assignments, hours, quiz_avg]])

        predicted_score = float(np.clip(self.performance_model.predict(features)[0], 0, 100))

        raw_proba = self.risk_model.predict_proba(features)[0]
        # Pad to 3 values if model only learned 2 classes due to training split
        classes = self.risk_model.named_steps["randomforestclassifier"].classes_
        proba_map = {c: p for c, p in zip(classes, raw_proba)}
        risk_proba = [proba_map.get(0, 0.0), proba_map.get(1, 0.0), proba_map.get(2, 0.0)]

        risk_class = int(np.argmax(risk_proba))
        risk_level = self.RISK_LABELS[risk_class]

        # dropout_risk_pct — weighted sum of medium (50) and high (100) class probabilities
        dropout_risk_pct = float(risk_proba[1] * 50 + risk_proba[2] * 100)
        dropout_risk_pct = min(100, dropout_risk_pct)

        confidence = float(max(risk_proba))

        return {
            "predicted_performance": round(predicted_score, 2),
            "dropout_risk": round(dropout_risk_pct, 2),
            "risk_level": risk_level,
            "confidence": round(confidence, 4),
        }

    def generate_recommendations(self, attendance: float, past_scores: float,
                                  assignments: float, hours: float,
                                  risk_level: str) -> list:
        """Rule-based recommendation engine."""
        recs = []

        if attendance < 75:
            recs.append({
                "category": "attendance",
                "message": f"Your attendance is at {attendance:.1f}%. Improve to above 85% — attendance is the #1 predictor of exam performance.",
                "priority": "critical" if attendance < 60 else "high",
            })
        elif attendance < 85:
            recs.append({
                "category": "attendance",
                "message": f"Good progress! Raise attendance from {attendance:.1f}% to above 85% to maximize your predicted score.",
                "priority": "medium",
            })

        if past_scores < 60:
            recs.append({
                "category": "performance",
                "message": "Your past scores indicate weak areas. Focus on reviewing fundamentals and attempt past exam papers for targeted practice.",
                "priority": "high",
            })
        elif past_scores < 75:
            recs.append({
                "category": "performance",
                "message": "You are in the average range. Targeting specific weak topics can push your scores above 80% within 3–4 weeks.",
                "priority": "medium",
            })

        if assignments < 75:
            recs.append({
                "category": "assignment",
                "message": f"Only {assignments:.0f}% of assignments submitted. Complete all pending assignments immediately — they account for significant grade weight.",
                "priority": "high",
            })

        if hours < 12:
            recs.append({
                "category": "habit",
                "message": f"Study hours ({hours:.0f}h/week) are below recommended levels. Aim for 15–20 hours per week for optimal performance improvement.",
                "priority": "medium",
            })

        if risk_level == "High":
            recs.append({
                "category": "intervention",
                "message": "🚨 AI has flagged you as high-risk. Schedule an urgent meeting with your academic advisor and use tutoring resources this week.",
                "priority": "critical",
            })
        elif risk_level == "Medium":
            recs.append({
                "category": "intervention",
                "message": "AI has flagged a medium dropout risk. Consider joining a study group and engaging more actively in class discussions.",
                "priority": "high",
            })

        if past_scores > 80 and attendance > 85:
            recs.append({
                "category": "course",
                "message": "Excellent performance! You are eligible for advanced electives or certification tracks in your strongest subjects.",
                "priority": "low",
            })

        return recs

    def get_model_stats(self) -> dict:
        self._ensure_trained()
        return {
            "performance_model": {
                "type": "Linear Regression",
                "r2_score": round(self.perf_r2, 4),
                "accuracy_pct": round(self.perf_r2 * 100, 2),
                "framework": "Scikit-learn",
                "training_samples": 800,
                "features": ["Attendance", "Past Scores", "Assignments %", "Study Hours", "Quiz Avg"],
            },
            "risk_model": {
                "type": "Random Forest Classifier",
                "accuracy": round(self.risk_accuracy, 4),
                "accuracy_pct": round(self.risk_accuracy * 100, 2),
                "n_estimators": 100,
                "classes": ["Low Risk", "Medium Risk", "High Risk"],
                "feature_importances": self.feature_importances,
                "framework": "Scikit-learn",
                "training_samples": 800,
            },
        }


# Global singleton — trained once on startup
ai_engine = AIAnalytics()
ai_engine.train()
