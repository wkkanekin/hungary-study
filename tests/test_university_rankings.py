import unittest,sys,json,copy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from ranking_sources import parse,validate_url
from refresh_university_rankings import update_record,refresh
from build_university_rankings import DATA,validate,build

class ParserTests(unittest.TestCase):
    def test_the_does_not_confuse_impact_subject_or_year(self):
        html='<h1>Test University</h1><h2>Impact Rankings 2026 101-200</h2><h4>World University Rankings 2027 <style>.x{color:red}</style><b>801 - 1000</b><sup>th</sup></h4><h4>Computer Science 2026 601-800<sup>th</sup></h4><h4>Business and Economics 2023 401-500<sup>th</sup></h4>'
        r=parse('THE',html)['rankings']
        self.assertEqual(r['World University Rankings'],{'rank':'801-1000','year':2027})
        self.assertEqual(r['Business and Economics']['year'],2023)
        self.assertNotIn('Impact Rankings',r)
    def test_missing_year_is_not_borrowed(self):
        r=parse('THE','<h1>Test</h1><h4>Computer Science 401-500</h4><h4>World University Rankings 2027 601-800</h4>')['rankings']
        self.assertNotIn('Computer Science',r)
    def test_qs_subject_is_not_overall(self):
        r=parse('QS','<h1>Test</h1>It is ranked #101-200 in QS WUR Ranking By Subject 2026.')
        self.assertEqual(r['rankings'],{})
    def test_qs_tied_rank_and_year(self):
        r=parse('QS','<h1>Test</h1>It is ranked #=595 in QS World University Rankings 2027.')
        self.assertEqual(r['rankings']['World University Rankings'],{'rank':'=595','year':2027})
    def test_arwu_distinct_subjects_and_single_rank(self):
        r=parse('ARWU','<h1>Test</h1>Test ranks #701-800 in the 2026 Academic Ranking of World Universities. Test has 2 subjects ranked in the 2026 Global Ranking of Academic Subjects, with its best ranked subjects being Pharmacy &amp; Pharmaceutical Sciences (#44) and Clinical Medicine (#151-200).')['rankings']
        self.assertEqual(r['Pharmacy & Pharmaceutical Sciences']['rank'],'44')
        self.assertEqual(r['Clinical Medicine']['year'],2026)
    def test_nonofficial_source_rejected(self):
        for url in ['http://www.topuniversities.com/a','https://example.com/','https://www.topuniversities.com.evil.test/']:
            with self.assertRaises(ValueError):validate_url(url)

class PreservationTests(unittest.TestCase):
    def setUp(self):
        self.record={'status':'ranked','year':2027,'rank':'801-1000','checked_at':'2026-10-04','source_id':'test'}
    def test_network_failure_preserves_rank_year_date(self):
        r=update_record(self.record,None,'World University Rankings','2026-11-01')
        for key in self.record:self.assertEqual(r[key],self.record[key])
        self.assertEqual(r['latest_attempt']['status'],'failed')
    def test_new_edition_updates_when_explicitly_confirmed(self):
        r=update_record(self.record,{'rankings':{'World University Rankings':{'year':2028,'rank':'501-600'}}},'World University Rankings','2027-10-01')
        self.assertEqual(r['year'],2028);self.assertEqual(r['rank'],'501-600');self.assertEqual(r['checked_at'],'2027-10-01')
    def test_impossible_future_year_is_not_published(self):
        r=update_record(self.record,{'rankings':{'World University Rankings':{'year':2030,'rank':'1'}}},'World University Rankings','2026-11-01')
        self.assertEqual(r['year'],2027);self.assertEqual(r['rank'],'801-1000')
    def test_older_year_cannot_replace_confirmed_newer_year(self):
        r=update_record(self.record,{'rankings':{'World University Rankings':{'year':2026,'rank':'401-500'}}},'World University Rankings','2026-11-01')
        self.assertEqual(r['year'],2027);self.assertEqual(r['rank'],'801-1000')
    def test_unavailable_not_assumed_unlisted(self):
        r=update_record(dict(self.record,status='unconfirmed',rank=None,checked_at=None),{'rankings':{}},'World University Rankings','2026-11-01')
        self.assertEqual(r['status'],'unconfirmed');self.assertIsNone(r['rank'])
    def test_confirmed_same_edition_refreshes(self):
        r=update_record(self.record,{'rankings':{'World University Rankings':{'year':2027,'rank':'701-800'}}},'World University Rankings','2026-11-01')
        self.assertEqual(r['rank'],'701-800');self.assertEqual(r['checked_at'],'2026-11-01')
    def test_new_year_updates_column_target_and_retains_other_editions(self):
        d=json.loads(DATA.read_text())
        elte=next(u for u in d['universities'] if u['id']=='elte')
        key=elte['overall']['QS']['source_id']
        results={key:{'rankings':{'World University Rankings':{'year':2028,'rank':'=500'}}}}
        out=refresh(d,results,'2027-07-01')
        self.assertEqual(out['target_editions']['QS'],2028)
        self.assertEqual(next(u for u in out['universities'] if u['id']=='elte')['overall']['QS']['year'],2028)
        self.assertEqual(next(u for u in out['universities'] if u['id']=='debrecen')['overall']['QS']['year'],2027)
    def test_total_outage_preserves_all_verified_records(self):
        d=json.loads(DATA.read_text());out=refresh(d,{},'2026-11-01')
        before=[r for u in d['universities'] for r in u['overall'].values()]+d['subjects']
        after=[r for u in out['universities'] for r in u['overall'].values()]+out['subjects']
        for a,b in zip(before,after):
            if a['status']=='ranked':
                for key in ('rank','year','checked_at','status'):self.assertEqual(a[key],b[key])
        self.assertEqual(d,json.loads(DATA.read_text()))
    def test_existing_confirmed_unlisted_is_preserved(self):
        r=update_record(dict(self.record,status='not_listed',rank=None),None,'World University Rankings','2026-11-01')
        self.assertEqual(r['status'],'not_listed')

class DatasetTests(unittest.TestCase):
    def test_dataset_schema(self):validate(json.loads(DATA.read_text()))
    def test_registry_duplicate_id_rejected(self):
        d=json.loads(DATA.read_text());d['universities'][1]['registry_id']=d['universities'][0]['registry_id']
        with self.assertRaises(AssertionError):validate(d)
    def test_registry_incomplete_count_rejected(self):
        d=json.loads(DATA.read_text());d['universities'].pop()
        with self.assertRaises(AssertionError):validate(d)
    def test_refresh_preserves_unverified_registry_institutions(self):
        d=json.loads(DATA.read_text());out=refresh(d,{},'2026-11-01')
        self.assertEqual(out['registry'],d['registry'])
        self.assertEqual([u['registry_id'] for u in out['universities']],[u['registry_id'] for u in d['universities']])
        ibs=next(u for u in out['universities'] if u['registry_id']=='FI35200')
        self.assertTrue(all(r['status']=='unconfirmed' and r['rank'] is None for r in ibs['overall'].values()))

    def test_both_static_pages_match_shared_data(self):build(json.loads(DATA.read_text()),check=True)
    def test_every_subject_has_correct_publisher(self):
        d=json.loads(DATA.read_text())
        for r in d['subjects']:self.assertEqual(r['provider'],d['sources'][r['source_id']]['provider'])

if __name__=='__main__':unittest.main()
