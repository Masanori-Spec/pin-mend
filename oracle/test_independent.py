"""Independent enumeration: does not load or translate the JS solver implementation."""
import itertools,json,random,subprocess,unittest
PINS=tuple(range(2,14)); PWM={3,5,6,9,10,11}
def oracle(p):
    features=p['features']; rows=sorted([s for s in p['signals'] if s['type'] not in ('servo','tone') or features[s['type']]],key=lambda x:x['id'])
    blocked=set(p['unavailable']); excluded=({9,10} if features['servo'] else set())|({3,11} if features['tone'] else set())
    domains=[]
    for s in rows:
        allowed=set(PINS)-blocked
        if s['type']=='led-pwm': allowed &= PWM-excluded
        if s['fixed']: allowed &= {s['pin']}
        domains.append(sorted(allowed))
    best=None
    for pins in itertools.product(*domains):
        if len(set(pins))!=len(pins):continue
        score=(sum(pin!=s['pin'] for pin,s in zip(pins,rows)),pins)
        if best is None or score<best:best=score
    return best

def example(servo=True,tone=True):
    return dict(schema='pinmend/1',features=dict(servo=servo,tone=tone),unavailable=[],signals=[dict(id=i,type=t,pin=p,fixed=f) for i,t,p,f in [('LED_A','led-pwm',9,False),('LED_B','led-pwm',10,False),('BUTTON_A','digital-in',5,False),('BUTTON_B','digital-in',6,False),('SERVO','servo',8,True),('TONE','tone',12,True)]])
class Check(unittest.TestCase):
    def test_exhaustive_and_seeded(self):
        cases=[example(s,t) for s,t in itertools.product((False,True),repeat=2)]
        locked=example();locked['signals'][2]['fixed']=True;cases.append(locked)
        rng=random.Random(718342)
        for _ in range(240):
            signals=[dict(id=f'S_{i}',type=rng.choice(['led-pwm','digital-in','digital-out']),pin=rng.choice(PINS),fixed=rng.random()<.25) for i in range(rng.randint(1,5))]
            cases.append(dict(schema='pinmend/1',features=dict(servo=False,tone=False),unavailable=rng.sample(PINS,rng.randint(0,5)),signals=signals))
        results=json.loads(subprocess.check_output(['node','scripts/solve-json.mjs'],input=json.dumps(cases),text=True))
        for p,r in zip(cases,results):
            expected=oracle(p)
            with self.subTest(p=p):
                if expected is None:self.assertEqual(r['status'],'infeasible')
                else:self.assertEqual((r['cost'],tuple(s['pin'] for s in r['assignments'])),expected)
        report=dict(status='passed',cases=len(cases),method='Independent Python Cartesian-product enumeration; seeded random cases plus four feature fixtures and fixed-button infeasibility',fixture_lower_bound='Two Timer1 LEDs must move; the only remaining PWM pins D5/D6 displace two buttons. Lower bound four, attained by solver.')
        from pathlib import Path
        Path('evidence').mkdir(exist_ok=True);Path('evidence/independent-oracle.json').write_text(json.dumps(report,indent=2)+'\n')
    def test_fixture_lower_bound(self):
        p=example();self.assertEqual(oracle(p)[0],4)
        p['signals'][2]['fixed']=True;self.assertIsNone(oracle(p))
if __name__=='__main__':unittest.main()
