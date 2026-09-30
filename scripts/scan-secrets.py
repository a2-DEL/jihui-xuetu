#!/usr/bin/env python3
"""Conservative secret inventory. Never prints/writes secret values. Exit 1 when candidates exist."""
from pathlib import Path
import argparse, json, re, sys
ROOT = Path(__file__).resolve().parents[1]
SOURCES = (ROOT/'src', ROOT/'scripts', ROOT/'docs')
KEY_NAME = re.compile(r'(?:API[_-]?KEY|SECRET|ACCESS[_-]?TOKEN|PRIVATE[_-]?KEY|PASSWORD)', re.I)
SK = re.compile(r'\bsk-[A-Za-z0-9_-]{16,}\b')
PEM = re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')
PLACEHOLDER = re.compile(r'^(?:REPLACE_|YOUR_|<|\$\{|process\.|os\.|example|demo|test|changeme|undefined|none|\s*$)', re.I)

def candidates():
    paths = [*ROOT.glob('.env*')]
    for base in SOURCES:
        if base.is_dir():
            paths.extend(p for p in base.rglob('*') if p.is_file() and p.suffix in {'.ts','.tsx','.js','.mjs','.cjs','.py','.json','.md','.sh','.txt'})
    return sorted(set(paths))

def scan():
    findings=[]
    for p in candidates():
        if any(x in p.parts for x in ('node_modules','.next','.runtime','artifacts')): continue
        try: lines=p.read_text(encoding='utf8').splitlines()
        except (UnicodeError,OSError): continue
        for i,line in enumerate(lines,1):
            rule=None
            if PEM.search(line): rule='private_key_header'
            elif SK.search(line): rule='provider_key_format'
            elif p.name.startswith('.env') and '=' in line and not line.lstrip().startswith('#'):
                name,value=line.split('=',1)
                if KEY_NAME.search(name) and len(value.strip())>=12 and not PLACEHOLDER.match(value.strip()):rule='environment_secret_literal'
            if rule: findings.append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'line':i,'rule':rule})
    return findings

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);a=parser.parse_args()
    result={'scope':'local first-party text files and .env*; no binary/archived history', 'findings':scan(), 'valuesRecorded':False}
    if a.output:
        a.output.parent.mkdir(parents=True,exist_ok=True)
        a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f"Secret candidate locations: {len(result['findings'])}; values are never printed")
    for finding in result['findings'][:30]:print(f"{finding['path']}:{finding['line']} [{finding['rule']}]")
    if len(result['findings'])>30:print(f"... {len(result['findings'])-30} additional locations in report")
    sys.exit(1 if result['findings'] else 0)
