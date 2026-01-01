"""
Health Analyzer Service for Healthcatchers.

Provides multi-health assessment from user input data including:
- BMI analysis
- Blood pressure analysis
- Sleep health analysis
- Stress analysis
- Lifestyle analysis (when optional data provided)
- Cardiovascular analysis (when heart rate provided)
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class HealthStatus(Enum):
    """Health status levels for visual indicators."""
    GOOD = "good"
    WARNING = "warning"
    DANGER = "danger"
    UNKNOWN = "unknown"


@dataclass
class HealthReport:
    """Individual health report with status and message."""
    name: str
    status: HealthStatus
    value: str
    message: str
    recommendations: list[str]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "status": self.status.value,
            "value": self.value,
            "message": self.message,
            "recommendations": self.recommendations
        }


class HealthAnalyzer:
    """
    Multi-health analyzer that generates health reports from user input.
    
    Provides basic reports from required fields and advanced reports
    when optional fields are provided.
    """

    BMI_UNDERWEIGHT = 18.5
    BMI_NORMAL = 24.9
    BMI_OVERWEIGHT = 29.9

    BP_NORMAL = (120, 80)
    BP_ELEVATED = (129, 80)
    BP_HIGH_1 = (139, 89)
    BP_HIGH_2 = (180, 120)

    SLEEP_MIN = 6
    SLEEP_OPTIMAL_MIN = 7
    SLEEP_OPTIMAL_MAX = 9

    HR_LOW = 60
    HR_HIGH = 100

    def analyze(self, data: dict) -> dict:
        """Perform comprehensive health analysis."""
        basic_reports = self._get_basic_reports(data)
        advanced_reports = self._get_advanced_reports(data)
        summary = self._generate_summary(basic_reports, advanced_reports)

        return {
            "basic_reports": [r.to_dict() for r in basic_reports],
            "advanced_reports": [r.to_dict() for r in advanced_reports],
            "summary": summary
        }

    def _get_basic_reports(self, data: dict) -> list[HealthReport]:
        """Generate basic health reports from required fields."""
        reports = []

        if self._has_fields(data, ["Height", "Weight"]):
            reports.append(self._analyze_bmi(data))

        if self._has_fields(data, ["Blood pressure"]):
            reports.append(self._analyze_blood_pressure(data))

        if self._has_fields(data, ["Sleep duration", "Sleep quality"]):
            reports.append(self._analyze_sleep_basic(data))

        if self._has_fields(data, ["Stress level"]):
            reports.append(self._analyze_stress(data))

        return reports

    def _get_advanced_reports(self, data: dict) -> list[HealthReport]:
        """Generate advanced reports when optional fields are provided."""
        reports = []

        if self._has_fields(data, ["Heart rate"]):
            reports.append(self._analyze_cardiovascular(data))

        sleep_fields = ["Sleep disorder", "Wake up during night", 
                       "Feel sleepy during day", "Smart device before bed"]
        if any(self._has_fields(data, [f]) for f in sleep_fields):
            reports.append(self._analyze_sleep_advanced(data))

        lifestyle_fields = ["Daily steps", "Physical activity", 
                           "Caffeine consumption", "Alcohol consumption", "Smoking"]
        if any(self._has_fields(data, [f]) for f in lifestyle_fields):
            reports.append(self._analyze_lifestyle(data))

        return reports

    def _analyze_bmi(self, data: dict) -> HealthReport:
        """Analyze BMI from height and weight."""
        height_m = data["Height"] / 100
        weight = data["Weight"]
        bmi = weight / (height_m ** 2)

        if bmi < self.BMI_UNDERWEIGHT:
            status = HealthStatus.WARNING
            message = "Underweight"
            recommendations = [
                "Increase nutrition with protein-rich foods",
                "Eat more frequent small meals",
                "Consult a nutritionist"
            ]
        elif bmi <= self.BMI_NORMAL:
            status = HealthStatus.GOOD
            message = "Normal weight"
            recommendations = ["Maintain your current diet and exercise routine"]
        elif bmi <= self.BMI_OVERWEIGHT:
            status = HealthStatus.WARNING
            message = "Overweight"
            recommendations = [
                "Reduce daily calorie intake",
                "Increase physical activity",
                "Limit sugary and fatty foods"
            ]
        else:
            status = HealthStatus.DANGER
            message = "Obese"
            recommendations = [
                "Consult a doctor about weight loss plan",
                "Develop an appropriate diet",
                "Start with light exercise, gradually increase intensity"
            ]

        return HealthReport(
            name="BMI",
            status=status,
            value=f"{bmi:.1f}",
            message=message,
            recommendations=recommendations
        )

    def _analyze_blood_pressure(self, data: dict) -> HealthReport:
        """Analyze blood pressure status."""
        bp_str = data["Blood pressure"]
        
        if "/" in str(bp_str):
            parts = str(bp_str).split("/")
            systolic = int(parts[0])
            diastolic = int(parts[1])
        else:
            systolic = 120
            diastolic = 80

        if systolic < self.BP_NORMAL[0] and diastolic < self.BP_NORMAL[1]:
            status = HealthStatus.GOOD
            message = "Normal blood pressure"
            recommendations = ["Maintain a healthy lifestyle"]
        elif systolic < self.BP_ELEVATED[0]:
            status = HealthStatus.GOOD
            message = "Normal blood pressure"
            recommendations = ["Continue regular blood pressure monitoring"]
        elif systolic < self.BP_HIGH_1[0] or diastolic < self.BP_HIGH_1[1]:
            status = HealthStatus.WARNING
            message = "Elevated blood pressure"
            recommendations = [
                "Reduce salt in your diet",
                "Exercise regularly",
                "Monitor blood pressure frequently"
            ]
        elif systolic < self.BP_HIGH_2[0] or diastolic < self.BP_HIGH_2[1]:
            status = HealthStatus.DANGER
            message = "High blood pressure Stage 1"
            recommendations = [
                "Consult a doctor",
                "Reduce stress",
                "Limit alcohol and tobacco"
            ]
        else:
            status = HealthStatus.DANGER
            message = "Severe high blood pressure"
            recommendations = [
                "See a doctor immediately",
                "Monitor blood pressure daily",
                "Follow prescribed treatment strictly"
            ]

        return HealthReport(
            name="Blood Pressure",
            status=status,
            value=f"{systolic}/{diastolic} mmHg",
            message=message,
            recommendations=recommendations
        )

    def _analyze_sleep_basic(self, data: dict) -> HealthReport:
        """Analyze basic sleep health."""
        duration = data.get("Sleep duration", 7)
        quality = data.get("Sleep quality", 3)

        if duration < self.SLEEP_MIN:
            status = HealthStatus.DANGER
            message = "Severe sleep deprivation"
            recommendations = [
                "Try to sleep at least 7 hours per night",
                "Establish a regular bedtime routine",
                "Avoid caffeine after 2 PM"
            ]
        elif duration < self.SLEEP_OPTIMAL_MIN:
            status = HealthStatus.WARNING
            message = "Insufficient sleep"
            recommendations = [
                "Increase sleep time by 30-60 minutes",
                "Improve sleep environment"
            ]
        elif duration <= self.SLEEP_OPTIMAL_MAX:
            if quality >= 4:
                status = HealthStatus.GOOD
                message = "Good sleep"
                recommendations = ["Maintain your current sleep habits"]
            else:
                status = HealthStatus.WARNING
                message = "Adequate duration but poor quality"
                recommendations = [
                    "Improve sleep environment",
                    "Avoid screens 1 hour before bed"
                ]
        else:
            status = HealthStatus.WARNING
            message = "Excessive sleep"
            recommendations = [
                "Reduce sleep to 7-8 hours",
                "Check health if still feeling tired"
            ]

        return HealthReport(
            name="Sleep",
            status=status,
            value=f"{duration}h - Quality {quality}/5",
            message=message,
            recommendations=recommendations
        )

    def _analyze_stress(self, data: dict) -> HealthReport:
        """Analyze stress level."""
        stress = data.get("Stress level", 3)

        if stress <= 2:
            status = HealthStatus.GOOD
            message = "Low stress level"
            recommendations = ["Continue maintaining work-life balance"]
        elif stress == 3:
            status = HealthStatus.GOOD
            message = "Moderate stress level"
            recommendations = [
                "Take time to relax daily",
                "Exercise to reduce stress"
            ]
        elif stress == 4:
            status = HealthStatus.WARNING
            message = "High stress"
            recommendations = [
                "Practice meditation or yoga",
                "Reduce workload if possible",
                "Talk to someone about your stress"
            ]
        else:
            status = HealthStatus.DANGER
            message = "Very high stress"
            recommendations = [
                "Consider professional counseling",
                "Prioritize rest",
                "Identify and address stress sources"
            ]

        return HealthReport(
            name="Stress",
            status=status,
            value=f"Level {stress}/5",
            message=message,
            recommendations=recommendations
        )

    def _analyze_cardiovascular(self, data: dict) -> HealthReport:
        """Analyze cardiovascular health from heart rate."""
        hr = data.get("Heart rate", 75)

        if hr < self.HR_LOW:
            status = HealthStatus.WARNING
            message = "Low heart rate"
            recommendations = [
                "Watch for symptoms like dizziness",
                "Consult a doctor if symptoms occur"
            ]
        elif hr <= self.HR_HIGH:
            status = HealthStatus.GOOD
            message = "Normal heart rate"
            recommendations = ["Maintain a healthy lifestyle"]
        else:
            status = HealthStatus.WARNING
            message = "Elevated heart rate"
            recommendations = [
                "Reduce caffeine intake",
                "Check if condition persists",
                "Practice deep breathing to relax"
            ]

        return HealthReport(
            name="Cardiovascular",
            status=status,
            value=f"{hr} bpm",
            message=message,
            recommendations=recommendations
        )

    def _analyze_sleep_advanced(self, data: dict) -> HealthReport:
        """Analyze advanced sleep factors."""
        issues = []
        recommendations = []

        if data.get("Sleep disorder") == "Y":
            issues.append("sleep disorder")
            recommendations.append("Consult a doctor about sleep disorder treatment")

        if data.get("Wake up during night") == "Y":
            issues.append("waking up at night")
            recommendations.append("Avoid drinking too much water before bed")

        if data.get("Feel sleepy during day") == "Y":
            issues.append("daytime sleepiness")
            recommendations.append("Take short 15-20 minute naps")

        if data.get("Smart device before bed") == "Y":
            issues.append("device use before bed")
            recommendations.append("Turn off devices at least 1 hour before sleep")

        if len(issues) == 0:
            status = HealthStatus.GOOD
            message = "No advanced sleep issues"
            recommendations = ["Maintain good sleep habits"]
        elif len(issues) <= 2:
            status = HealthStatus.WARNING
            message = f"Issues: {', '.join(issues)}"
        else:
            status = HealthStatus.DANGER
            message = f"Multiple sleep issues: {', '.join(issues)}"

        return HealthReport(
            name="Advanced Sleep",
            status=status,
            value=f"{len(issues)} issues",
            message=message,
            recommendations=recommendations if recommendations else ["Maintain good sleep habits"]
        )

    def _analyze_lifestyle(self, data: dict) -> HealthReport:
        """Analyze lifestyle factors."""
        score = 0
        max_score = 0
        recommendations = []

        if "Daily steps" in data and data["Daily steps"]:
            max_score += 2
            steps = data["Daily steps"]
            if steps >= 8000:
                score += 2
            elif steps >= 5000:
                score += 1
                recommendations.append("Increase daily steps to 8000")
            else:
                recommendations.append("Try to walk more, aim for 8000 steps/day")

        if "Physical activity" in data and data["Physical activity"]:
            max_score += 2
            activity = data["Physical activity"]
            if activity >= 30:
                score += 2
            elif activity >= 15:
                score += 1
                recommendations.append("Increase exercise to 30 min/day")
            else:
                recommendations.append("Start with at least 15 min exercise/day")

        if "Smoking" in data:
            max_score += 3
            if data["Smoking"] == "N":
                score += 3
            else:
                recommendations.append("Quit smoking to significantly improve health")

        if "Alcohol consumption" in data:
            max_score += 1
            if data["Alcohol consumption"] == "N":
                score += 1
            else:
                recommendations.append("Limit alcohol consumption")

        if "Caffeine consumption" in data:
            max_score += 1
            if data["Caffeine consumption"] == "N":
                score += 1

        if max_score == 0:
            return HealthReport(
                name="Lifestyle",
                status=HealthStatus.UNKNOWN,
                value="Insufficient data",
                message="Need more lifestyle information",
                recommendations=[]
            )

        percentage = (score / max_score) * 100

        if percentage >= 80:
            status = HealthStatus.GOOD
            message = "Healthy lifestyle"
        elif percentage >= 50:
            status = HealthStatus.WARNING
            message = "Lifestyle needs improvement"
        else:
            status = HealthStatus.DANGER
            message = "Unhealthy lifestyle"

        return HealthReport(
            name="Lifestyle",
            status=status,
            value=f"{percentage:.0f}%",
            message=message,
            recommendations=recommendations if recommendations else ["Maintain your current lifestyle"]
        )

    def _generate_summary(self, basic: list[HealthReport], 
                         advanced: list[HealthReport]) -> dict:
        """Generate overall health summary."""
        all_reports = basic + advanced
        
        danger_count = sum(1 for r in all_reports if r.status == HealthStatus.DANGER)
        warning_count = sum(1 for r in all_reports if r.status == HealthStatus.WARNING)
        good_count = sum(1 for r in all_reports if r.status == HealthStatus.GOOD)

        if danger_count > 0:
            overall_status = "danger"
            overall_message = "Health issues require attention"
        elif warning_count > 0:
            overall_status = "warning"
            overall_message = "Some metrics need monitoring"
        else:
            overall_status = "good"
            overall_message = "Overall health is good"

        all_recommendations = []
        for report in all_reports:
            if report.status in [HealthStatus.DANGER, HealthStatus.WARNING]:
                all_recommendations.extend(report.recommendations[:2])

        return {
            "overall_status": overall_status,
            "overall_message": overall_message,
            "danger_count": danger_count,
            "warning_count": warning_count,
            "good_count": good_count,
            "top_recommendations": all_recommendations[:5]
        }

    @staticmethod
    def _has_fields(data: dict, fields: list[str]) -> bool:
        """Check if all required fields are present and not empty."""
        for field in fields:
            if field not in data or data[field] is None or data[field] == "":
                return False
        return True
