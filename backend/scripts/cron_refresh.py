"""
Weekly FRED data refresh cron job.
Run via: python -m backend.scripts.cron_refresh
"""
import os
import sys
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s [cron] %(message)s')
log = logging.getLogger('augur.cron')

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from backend.app.pipelines.fred.pipeline import FREDPipeline
from backend.app.core.integrity import AuditLogger
from backend.app.core.database import AugurDB

def main():
    log.info(f'Starting scheduled FRED refresh at {datetime.utcnow().isoformat()}')
    
    audit = AuditLogger()
    pipeline = FREDPipeline(audit_logger=audit)
    db = AugurDB(audit=audit)
    
    result = pipeline.fetch_all()
    log.info(f'FRED fetch complete: {result["passed"]}/{result["total"]} series passed')
    
    if result.get('rows'):
        db.insert_data_points(result['rows'])
        log.info(f'Inserted {len(result["rows"])} rows')
    
    audit.flush()
    log.info('Cron refresh complete')

if __name__ == '__main__':
    main()
