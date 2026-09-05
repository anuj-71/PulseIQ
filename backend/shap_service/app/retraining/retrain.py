from pathlib import Path
import subprocess

SERVICE_DIR = Path(__file__).resolve().parent.parent.parent
FEEDBACK_FILE = SERVICE_DIR / "feedback.csv"


def retrain_model():
    """
    Retrains the risk model using the latest data.
    """

    print("Starting retraining...")

    subprocess.run(
        ["python", "-m", "app.models.train"],
        check=True
    )

    print("Retraining completed successfully.")


if __name__ == "__main__":

    if FEEDBACK_FILE.exists():

        print("Feedback detected.")
        retrain_model()

    else:

        print("No feedback available. Skipping retraining.")
