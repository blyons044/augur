"""
Weekly FRED data refresh cron job.
Run via: python -m backend.scripts.cron_refresh
"""
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
    try:
        result = pipeline.fetch_all_series()
        passed = result.get('passed', 0)
        total = result.get('total', 0)
        log.info(f'FRED fetch complete: {passed}/{total} series passed')
        rows = result.get('rows', result.get('records', []))
        if rows:
            db.insert_data_points(rows)
            log.info(f'Inserted {len(rows)} rows')
        else:
            log.info('No new rows to insert')
    except Exception as e:
        log.error(f'FRED refresh failed: {e}')
    try:
        try:
        audit.flush()
    except AttributeError:
        pass
    except AttributeError:
        pass
    log.info('Cron refresh complete')

if __name__ == '__main__':
    main()
