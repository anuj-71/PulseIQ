import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "pulseiq-cloud-artifacts")

_boto_client = None


def get_s3_client():
    """Initializes and returns a boto3 S3 client if credentials exist."""
    global _boto_client
    if _boto_client is not None:
        return _boto_client

    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        try:
            import boto3
            _boto_client = boto3.client(
                "s3",
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            )
            return _boto_client
        except Exception as e:
            print(f"[AWS S3] Error initializing boto3 client: {e}")
            return None
    return None


def is_s3_configured() -> bool:
    return bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)


def get_s3_status() -> Dict[str, Any]:
    """Returns connectivity and configuration status for AWS S3."""
    configured = is_s3_configured()
    client = get_s3_client() if configured else None
    connected = False

    if client:
        try:
            client.head_bucket(Bucket=AWS_S3_BUCKET)
            connected = True
        except Exception:
            connected = False

    return {
        "service": "Amazon S3",
        "configured": configured,
        "connected": connected,
        "bucket": AWS_S3_BUCKET,
        "region": AWS_REGION,
        "mode": "AWS Live Cloud" if (configured and connected) else "Local Simulation"
    }


def upload_file_to_s3(local_path: str, s3_key: str, bucket_name: Optional[str] = None) -> bool:
    """Uploads a local file to S3 bucket."""
    bucket = bucket_name or AWS_S3_BUCKET
    client = get_s3_client()
    if client:
        try:
            client.upload_file(local_path, bucket, s3_key)
            print(f"[AWS S3] Uploaded {local_path} -> s3://{bucket}/{s3_key}")
            return True
        except Exception as e:
            print(f"[AWS S3] Upload error: {e}")
            return False
    print(f"[AWS S3 (Simulation)] Simulated upload of {local_path} to s3://{bucket}/{s3_key}")
    return True


def download_file_from_s3(s3_key: str, local_path: str, bucket_name: Optional[str] = None) -> bool:
    """Downloads a file from S3 to local storage."""
    bucket = bucket_name or AWS_S3_BUCKET
    client = get_s3_client()
    if client:
        try:
            Path(local_path).parent.mkdir(parents=True, exist_ok=True)
            client.download_file(bucket, s3_key, local_path)
            print(f"[AWS S3] Downloaded s3://{bucket}/{s3_key} -> {local_path}")
            return True
        except Exception as e:
            print(f"[AWS S3] Download error: {e}")
            return False
    return False


def list_s3_files(prefix: str = "", bucket_name: Optional[str] = None) -> List[str]:
    """Lists files in the S3 bucket with given prefix."""
    bucket = bucket_name or AWS_S3_BUCKET
    client = get_s3_client()
    if client:
        try:
            resp = client.list_objects_v2(Bucket=bucket, Prefix=prefix)
            return [item["Key"] for item in resp.get("Contents", [])]
        except Exception as e:
            print(f"[AWS S3] List error: {e}")
            return []
    return [f"models/risk_model.pth", f"docs/doc_dashboard.md", f"docs/faq_reset_password.md"]
