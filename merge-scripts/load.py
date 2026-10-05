import pandas as pd, glob, os
U='/root/.claude/uploads/f14e2a81-522f-5e43-8d49-674ad87e6b2c/'
def f(p): return glob.glob(U+'*'+p)[0]
def csv(p): return pd.read_csv(f(p),dtype=str,keep_default_na=False,encoding_errors='replace')
def xl(p,sheet=0): return pd.read_excel(f(p),sheet_name=sheet,dtype=str).fillna('')
