#!/usr/bin/env python3
"""Скрипт для резервного копирования базы данных Promo Manager."""

import json
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "server_config.json"

def load_config():
    """Загружает конфигурацию из server_config.json."""
    with CONFIG_PATH.open("r", encoding="utf-8") as fh:
        config = json.load(fh)
    return config

def resolve_db_path(config):
    """Определяет путь к базе данных из конфига."""
    raw_path = config.get("database_path") or "data/promo_manager.sqlite3"
    db_path = Path(raw_path)
    if not db_path.is_absolute():
        db_path = ROOT / db_path
    return db_path

CONFIG = load_config()
DB_PATH = resolve_db_path(CONFIG)
BACKUP_DIR = ROOT / "backups"

def create_backup():
    """Создаёт резервную копию SQLite базы данных."""
    if not DB_PATH.exists():
        print(f"База данных не найдена: {DB_PATH}")
        return False
    
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"promo_backup_{timestamp}.sqlite3"
    
    try:
        # Копирование через SQLite для консистентности
        src_conn = sqlite3.connect(str(DB_PATH))
        dst_conn = sqlite3.connect(str(backup_path))
        
        with src_conn:
            src_conn.backup(dst_conn)
        
        src_conn.close()
        dst_conn.close()
        
        print(f"Резервная копия создана: {backup_path}")
        return True
    except Exception as e:
        print(f"Ошибка при создании копии: {e}")
        return False

def list_backups():
    """Выводит список существующих резервных копий."""
    if not BACKUP_DIR.exists():
        print("Нет резервных копий")
        return
    
    backups = sorted(BACKUP_DIR.glob("promo_backup_*.sqlite3"), reverse=True)
    print(f"Найдено {len(backups)} резервных копий:")
    for bp in backups[:10]:  # Показываем последние 10
        stat = bp.stat()
        size_mb = stat.st_size / (1024 * 1024)
        mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
        print(f"  {bp.name} ({size_mb:.2f} MB) - {mtime}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_backups()
    else:
        success = create_backup()
        sys.exit(0 if success else 1)
