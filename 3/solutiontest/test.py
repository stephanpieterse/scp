import requests
import base64

requests.packages.urllib3.disable_warnings(
    requests.packages.urllib3.exceptions.InsecureRequestWarning)

defHeaders = {'x-username': 'jan'}
host = 'localhost:8093'
host = 'puzzle3.apollolms.co.za'

sreq = requests.Session()

for i in range(1, 129):
    print(i)
    r = sreq.get('https://'+host+'/puzzle/'+str(i),
                 headers=defHeaders, verify=False)
    payload = r.json()
    op = payload['op']
    solved = "1"
    if op == 'add':
        dat = payload['d'].split(" ")
        solved = str(int(dat[0]) + int(dat[1]))
    elif op == 'subtract':
        dat = payload['d'].split(" ")
        solved = str(int(dat[0]) - int(dat[1]))
    elif op == 'multiply':
        dat = payload['d'].split(" ")
        solved = str(int(dat[0]) * int(dat[1]))
    elif op == 'divide':
        dat = payload['d'].split(" ")
        solved = str(int(dat[0]) // int(dat[1]))
    elif op == 'base64-encode':
        solved = base64.b64encode(payload['d'].encode()).decode()
    elif op == 'base64-decode':
        solved = base64.b64decode(payload['d'].encode()).decode()
    elif op == 'concat':
        dat = payload['d'].split(" ")
        solved = str(dat[0]) + str(dat[1])
    r = sreq.post('https://'+host+'/solve/'+str(i), headers={**defHeaders, **{
                  'content-type': 'application/json'}}, data='{"solution": "' + solved + '"}', verify=False)
    print(r.text)
r = sreq.get('https://'+host+'/progress',
             headers={**defHeaders, **{'content-type': 'application/json'}}, verify=False)
print(r.text)
