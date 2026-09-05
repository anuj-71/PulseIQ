from app.explainability.shap_engine import explain_customer


def test_shap_output():

    sample = [
        0.55,
        3,
        0.72,
        0.60,
        2,
        14,
        3
    ]

    result = explain_customer(sample)

    assert "risk_score" in resultcl
    assert "attributions" in result
