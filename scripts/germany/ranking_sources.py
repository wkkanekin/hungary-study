"""Strict, edition-aware parsers for the three official ranking publishers."""
import re
from html.parser import HTMLParser
from urllib.parse import urlparse

ALLOWED_HOSTS = {'www.topuniversities.com', 'www.timeshighereducation.com', 'www.shanghairanking.com'}
RANK = r'=?[1-9]\d{0,3}(?:\s*[-–]\s*[1-9]\d{0,3}|\+)?'

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.headings=[]; self.active=None; self.buffer=[]; self.skip=0
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip += 1
        if tag in ('h1','h4'): self.active=tag; self.buffer=[]
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip=max(0,self.skip-1)
        if tag == self.active:
            self.headings.append((tag, ' '.join(self.buffer))); self.active=None
    def handle_data(self, data):
        if not self.skip:
            value=data.strip()
            if value:
                self.parts.append(value)
                if self.active: self.buffer.append(value)
    @property
    def text(self): return ' '.join(self.parts)

def normalize_rank(value):
    value = re.sub(r'\s+', '', value).replace('–','-')
    if not re.fullmatch(RANK, value): raise ValueError('Invalid rank')
    nums = [int(n) for n in re.findall(r'\d+', value)]
    if len(nums)==2 and nums[0]>nums[1]: raise ValueError('Reversed band')
    return value

def validate_url(url):
    u=urlparse(url)
    if u.scheme!='https' or u.hostname not in ALLOWED_HOSTS or u.username or u.password:
        raise ValueError('Only official HTTPS sources are allowed')

def parse(provider, html):
    page=Page();page.feed(html); found={}; title=next((v for tag,v in page.headings if tag=='h1'),'')
    if provider=='THE':
        for tag, value in page.headings:
            if tag!='h4': continue
            m=re.fullmatch(r'(.+?)\s+(20\d{2})\s+('+RANK+r')\s*(?:th|st|nd|rd)?\s*', value)
            if m:
                label,year,rank=m.groups(); found[label]={'year':int(year),'rank':normalize_rank(rank)}
    elif provider=='QS':
        m=re.search(r'It is ranked\s+#('+RANK+r')\s+in QS World University Rankings\s+(20\d{2})\.', page.text)
        if m: found['World University Rankings']={'year':int(m[2]),'rank':normalize_rank(m[1])}
    elif provider=='ARWU':
        m=re.search(r'ranks\s+#('+RANK+r')\s+in the (20\d{2}) Academic Ranking of World Universities\.',page.text)
        if m:found['Academic Ranking of World Universities']={'year':int(m[2]),'rank':normalize_rank(m[1])}
        m=re.search(r'has \d+ subjects ranked in the (20\d{2}) Global Ranking of Academic Subjects, with its best ranked subjects being (.+?)\.', page.text)
        if m:
            for label,rank in re.findall(r'([^(),]+?)\s*\(#('+RANK+r')\)',m[2]):
                label=re.sub(r'^\s*(?:and\s+)?','',label).strip()
                found[label]={'year':int(m[1]),'rank':normalize_rank(rank)}
    else: raise ValueError('Unknown provider')
    if not title: raise ValueError('Missing institution heading')
    return {'title':title, 'rankings':found}
