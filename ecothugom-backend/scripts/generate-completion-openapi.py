"""Regenerate the local contract for the eight requested backend capability groups. No network/credentials."""
import copy
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'
def read(name): return json.loads((DOCS/name).read_text(encoding='utf-8-sig'))
def write(name,value): (DOCS/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
ref=lambda name:{'$ref':'#/components/schemas/'+name}
text={'type':'string'}
null_text={'type':['string','null']}
ident={'type':'integer','format':'int64','minimum':1}
integer={'type':'integer','minimum':0}
version={**integer,'format':'int32','maximum':2147483646}
timestamp={'type':'string','format':'date-time'}
null_time={**timestamp,'type':['string','null']}
money={'type':'integer','minimum':0}
weight={'type':'number','minimum':0}
def obj(properties,required=None):return {'type':'object','additionalProperties':False,'properties':properties,'required':list(properties) if required is None else required}
def page(item):return obj({'data':{'type':'array','items':ref(item)},'page':integer,'size':integer,'totalElements':integer,'totalPages':integer})

# Update only the additive DTO fields and saved-address alternative in existing contracts.
for path in DOCS.glob('*openapi.json'):
    if path.name=='backend-completion-openapi.json':continue
    doc=read(path.name);before=copy.deepcopy(doc)
    schemas=doc.get('components',{}).get('schemas',{})
    for name in ('OrderItem','WeighRecord'):
        if name in schemas:
            schemas[name].setdefault('properties',{})['photoUrl']={**null_text,'maxLength':1000,'description':'Private /api/evidence/... URL for API uploads; GET requires order permission.'}
    if 'CreateOrder' in schemas:
        s=schemas['CreateOrder'];s['required']=[x for x in s.get('required',[]) if x!='pickupAddress']
        s['properties']['pickupAddress']={'anyOf':[ref('PickupAddress'),{'type':'null'}]}
        s['properties']['addressId']={**ident,'type':['integer','null']}
        s['oneOf']=[{'required':['pickupAddress'],'properties':{'pickupAddress':ref('PickupAddress'),'addressId':{'type':'null'}}},
                    {'required':['addressId'],'properties':{'addressId':ident,'pickupAddress':{'type':'null'}}}]
        s['description']='Select exactly one non-null pickupAddress or customer-owned addressId. Source is snapshotted; later address edits/deletion do not change historical contact/address.'
    if doc!=before:write(path.name,doc)

auth=read('auth-openapi.json')
spec={k:copy.deepcopy(auth[k]) for k in ('openapi','servers','components')}
spec['info']={'title':'EcoThuGom Backend Completion APIs','version':'1.0.0','description':'Admin catalog/prices plus profile, saved addresses, order changes, timeline/receipt, private evidence, disputes and reports. All customer cancellations require ADMIN approval. Existing collection-workflow and payment specs document the earlier core lifecycle. Local-only contract; not published to Postman cloud.'}
spec['paths']={k:copy.deepcopy(auth['paths'][k]) for k in ('/api/auth/csrf','/api/auth/login','/api/auth/me','/api/auth/logout')}
schemas=spec['components']['schemas']
for name in ('admin-catalog-openapi.json','admin-prices-openapi.json'):
    doc=read(name)
    for key,value in doc['components']['schemas'].items():
        if key in schemas:assert schemas[key]==value, f'Schema collision: {key}'
        schemas[key]=value
    spec['paths'].update(doc['paths'])
    for key,value in doc['components'].get('parameters',{}).items():spec['components'].setdefault('parameters',{})[key]=value

def import_schemas(filename,prefix):
    doc=read(filename)
    def rewrite(value):
        if isinstance(value,dict):
            for k,v in value.items():
                if k=='$ref' and v.startswith('#/components/'):
                    section,name=v.split('/')[-2:]
                    value[k]='#/components/'+section+'/'+(name if section=='securitySchemes' else prefix+name)
                else:rewrite(v)
        elif isinstance(value,list):
            for child in value:rewrite(child)
    for section,entries in doc['components'].items():
        for name,value in entries.items():
            value=copy.deepcopy(value);rewrite(value)
            spec['components'].setdefault(section,{})[name if section=='securitySchemes' else prefix+name]=value
    return doc
booking=import_schemas('collection-orders-openapi.json','Booking')
import_schemas('collection-workflow-openapi.json','Workflow')
import_schemas('simulated-payments-openapi.json','Payment')
booking_post=copy.deepcopy(booking['paths']['/api/customer/orders']['post'])
def rewrite_booking(value):
    if isinstance(value,dict):
        for k,v in value.items():
            if k=='$ref' and v.startswith('#/components/'):
                section,name=v.split('/')[-2:]
                value[k]='#/components/'+section+'/'+(name if section=='securitySchemes' else 'Booking'+name)
            else:rewrite_booking(v)
    elif isinstance(value,list):
        for child in value:rewrite_booking(child)
rewrite_booking(booking_post)
spec['paths'].setdefault('/api/customer/orders',{})['post']=booking_post

schemas['ProfileInput']=obj({'fullName':{**text,'minLength':1,'maxLength':100},'email':{**null_text,'format':'email','maxLength':254}},['fullName'])
schemas['PasswordChange']=obj({'currentPassword':{**text,'format':'password','minLength':1,'maxLength':64},'newPassword':{**text,'format':'password','minLength':12,'maxLength':64,'description':'Different from current, at most 72 UTF-8 bytes; success revokes old sessions.'}})
schemas['SavedAddressInput']=obj({'pickupAddress':ref('BookingPickupAddress'),'isDefault':{'type':['boolean','null']}},['pickupAddress'])
schemas['SavedAddress']=obj({'id':ident,'pickupAddress':ref('BookingPickupAddress'),'isDefault':{'type':'boolean'},'createdAt':timestamp})
schemas['SavedAddressPage']=page('SavedAddress')
reason={**text,'minLength':1,'maxLength':500}
schemas['CancellationInput']=obj({'version':version,'reason':reason})
schemas['RescheduleInput']=obj({'version':version,'reason':reason,'pickupStart':timestamp,'pickupEnd':timestamp})
schemas['ChangeCreateInput']=obj({'version':version,'requestType':{'type':'string','enum':['CANCEL','RESCHEDULE']},'reason':reason,'pickupStart':null_time,'pickupEnd':null_time},['version','requestType','reason'])
schemas['ChangeCreateInput']['description']='CANCEL: no new slot; RESCHEDULE: both future pickupStart and pickupEnd required. RESCHEDULE allowed only through EN_ROUTE. Every cancellation requires ADMIN approval.'
schemas['ChangeReviewInput']=obj({'version':version,'requestVersion':version,'responseNote':{**null_text,'maxLength':500}},['version','requestVersion'])
schemas['ReassignInput']=obj({'version':version,'collectorId':ident,'reason':reason})
schemas['ChangeRequest']=obj({'id':ident,'orderId':ident,'requestedBy':ident,'requestType':text,'reason':text,'oldPickupStart':timestamp,'oldPickupEnd':timestamp,'newPickupStart':null_time,'newPickupEnd':null_time,'status':{'type':'string','enum':['PENDING','APPROVED','REJECTED','WITHDRAWN']},'processedBy':{**ident,'type':['integer','null']},'processedAt':null_time,'responseNote':null_text,'version':integer,'createdAt':timestamp,'orderStatus':text,'orderVersion':integer})
schemas['ChangePage']=page('ChangeRequest')
schemas['TimelineEvent']=obj({'id':ident,'oldStatus':null_text,'newStatus':text,'changedBy':ident,'changedByName':text,'oldCollectorId':{**ident,'type':['integer','null']},'newCollectorId':{**ident,'type':['integer','null']},'reason':null_text,'changedAt':timestamp})
schemas['TimelinePage']=page('TimelineEvent')
schemas['Receipt']=obj({'order':ref('WorkflowOrder'),'quote':ref('WorkflowQuote'),'payment':ref('PaymentPayment'),'weighings':{'type':'array','items':ref('WorkflowWeighRecord')}})
schemas['EvidenceUpload']=obj({'orderId':ident,'orderVersion':integer,'url':{**text,'pattern':'^/api/evidence/[a-f0-9]{32}\\.(png|jpg)$'},'mediaType':{'type':'string','enum':['image/png','image/jpeg']}})
schemas['EvidenceForm']=obj({'file':{'type':'string','format':'binary','description':'Real PNG/JPEG <=5 MiB; <=16 million pixels, each dimension <=8192. Original filename/MIME are not trusted.'},'version':version})
dispute_state={'type':'string','enum':['OPEN','IN_REVIEW','RESOLVED','REJECTED']}
schemas['DisputeOpenInput']=obj({'version':version,'reason':{**text,'minLength':1,'maxLength':1000},'evidenceUrl':{**null_text,'maxLength':1000,'description':'Only a private evidence URL already linked to this order.'}},['version','reason'])
schemas['DisputeReviewInput']=obj({'version':version})
schemas['DisputeCloseInput']=obj({'version':version,'resolution':{**text,'minLength':1,'maxLength':1000}})
schemas['Dispute']=obj({'id':ident,'orderId':ident,'openedBy':ident,'reason':text,'evidenceUrl':null_text,'previousOrderStatus':text,'status':dispute_state,'resolution':null_text,'resolvedBy':{**ident,'type':['integer','null']},'resolvedAt':null_time,'createdAt':timestamp,'orderStatus':text,'orderVersion':integer})
schemas['DisputePage']=page('Dispute')
schemas['ReportPeriod']=obj({'from':{'type':'string','format':'date'},'to':{'type':'string','format':'date'},'timeZone':{'const':'Asia/Ho_Chi_Minh'},'fromInclusive':timestamp,'toExclusive':timestamp})
schemas['ReportOverview']=obj({'period':ref('ReportPeriod'),'currency':{'const':'VND'},'weightUnit':{'const':'KG'},'totalOrders':integer,'completedOrders':integer,'completionRatePercent':{'type':'number','minimum':0,'maximum':100},'ordersByStatus':{'type':'array','items':obj({'status':text,'count':integer})},'paidOrders':integer,'totalPaidAmount':money,'totalWeight':weight})
schemas['ReportOverview']['description']='Order metrics use created_at cohort; completedOrders counts non-null completed_at including paid disputes. Financial/weight metrics use COMPLETED payments by paid_at, [from,to) in Vietnam calendar.'
schemas['MaterialReportRow']=obj({'materialId':ident,'materialName':text,'grade':text,'unit':text,'currency':{'const':'VND'},'paidOrders':integer,'totalWeight':weight,'totalAmount':money})
schemas['CollectorReportRow']=obj({'collectorId':ident,'collectorName':text,'currency':{'const':'VND'},'weightUnit':{'const':'KG'},'paidOrders':integer,'totalWeight':weight,'totalAmount':money})
schemas['MaterialReportPage']=page('MaterialReportRow');schemas['CollectorReportPage']=page('CollectorReportRow')

pagination={'page':{**integer,'default':0},'size':{'type':'integer','minimum':1,'maximum':100,'default':20}}
dates={'from':{'type':'string','format':'date','description':'Vietnam calendar; defaults first day of current month.'},'to':{'type':'string','format':'date','description':'Exclusive; defaults first day of next month. Window 1..366 days.'}}
def add(path,method,name,tag,output=None,body=None,query=None,created=False,empty=False,multipart=False,binary=False,summary=''):
    write_op=method!='get'
    operation={'operationId':name,'tags':[tag],'summary':summary or name,'security':[{'sessionCookie':[],**({'csrfToken':[]} if write_op else {})}],'parameters':[],'responses':{}}
    for key in re.findall(r'\{([^{}]+)\}',path):operation['parameters'].append({'in':'path','name':key,'required':True,'schema':{**text,'pattern':'^[a-f0-9]{32}\\.(png|jpg)$'} if key=='name' else ident})
    for key,value in (query or {}).items():operation['parameters'].append({'in':'query','name':key,'required':False,'schema':value})
    code='204' if empty else ('201' if created else '200')
    operation['responses'][code]={'description':'Success'}
    if output:operation['responses'][code]['content']={'application/json':{'schema':ref(output)}}
    if binary:operation['responses'][code]['content']={mime:{'schema':{'type':'string','format':'binary'}} for mime in ('image/png','image/jpeg')}
    for error,description in [('400','Invalid body/filter/date/file'),('401','Sign in required or revoked session'),('403','Role or CSRF denied'),('404','Resource missing or outside order ownership/assignment'),('409','State/version changed, duplicate pending request, immutable snapshot or receipt unavailable'),('413','File exceeds 5 MiB'),('500','Persistence or storage failure; no SQL/secret details')]:operation['responses'][error]={'description':description,'content':{'application/problem+json':{'schema':ref('Problem')}}}
    if body:operation['requestBody']={'required':True,'content':{'multipart/form-data' if multipart else 'application/json':{'schema':ref(body)}}}
    spec['paths'].setdefault(path,{})[method]=operation

add('/api/auth/profile','put','updateOwnProfile','Hồ sơ','User','ProfileInput')
add('/api/auth/password','post','changeOwnPassword','Hồ sơ',body='PasswordChange',empty=True,summary='Change password and revoke all old sessions')
base='/api/customer/addresses'
add(base,'get','listOwnAddresses','Địa chỉ','SavedAddressPage',query=pagination)
add(base,'post','createOwnAddress','Địa chỉ','SavedAddress','SavedAddressInput',created=True)
add(base+'/{id}','get','getOwnAddress','Địa chỉ','SavedAddress')
add(base+'/{id}','put','replaceOwnAddress','Địa chỉ','SavedAddress','SavedAddressInput')
add(base+'/{id}','delete','deleteOwnAddress','Địa chỉ',empty=True)
add(base+'/{id}/default','put','setOwnDefaultAddress','Địa chỉ','SavedAddress')
base='/api/customer/orders/{id}'
add(base+'/cancel','post','requestOrderCancellation','Hủy và đổi lịch','ChangeRequest','CancellationInput',created=True,summary='Request cancellation; order stays active until ADMIN approval')
add(base+'/reschedule','post','rescheduleBeforeDeparture','Hủy và đổi lịch','WorkflowOrder','RescheduleInput')
add(base+'/change-requests','get','listOwnOrderChangeRequests','Hủy và đổi lịch','ChangePage',query=pagination)
add(base+'/change-requests','post','createOrderChangeRequest','Hủy và đổi lịch','ChangeRequest','ChangeCreateInput',created=True)
add(base+'/change-requests/{requestId}/withdraw','post','withdrawOwnOrderChangeRequest','Hủy và đổi lịch','ChangeRequest','ChangeReviewInput')
add('/api/admin/order-change-requests','get','adminListOrderChangeRequests','Hủy và đổi lịch','ChangePage',query={**pagination,'status':{'type':'string','enum':['PENDING','APPROVED','REJECTED','WITHDRAWN']}})
for action in ('approve','reject'):add('/api/admin/order-change-requests/{requestId}/'+action,'post','admin'+action.title()+'OrderChangeRequest','Hủy và đổi lịch','ChangeRequest','ChangeReviewInput')
add('/api/admin/orders/{id}/reassign','post','adminReassignBeforeDeparture','Hủy và đổi lịch','WorkflowOrder','ReassignInput')
for scope in ('customer','collector','admin'):
    add('/api/'+scope+'/orders/{id}/timeline','get',scope+'OrderTimeline','Lịch sử và biên nhận','TimelinePage',query=pagination)
    add('/api/'+scope+'/orders/{id}/receipt','get',scope+'PaidOrderReceipt','Lịch sử và biên nhận','Receipt')
for scope in ('customer','admin'):add('/api/'+scope+'/orders/{id}/weighings','get',scope+'ReadWeighings','Lịch sử và biên nhận','WorkflowWeighResult')
add('/api/customer/orders/{id}/items/{itemId}/photo','post','uploadOwnMaterialEvidence','Ảnh minh chứng','EvidenceUpload','EvidenceForm',created=True,multipart=True)
add('/api/collector/orders/{id}/weighings/{weighingId}/photo','post','uploadAssignedWeighingEvidence','Ảnh minh chứng','EvidenceUpload','EvidenceForm',created=True,multipart=True)
add('/api/evidence/{name}','get','readPrivateOrderEvidence','Ảnh minh chứng',binary=True)
add('/api/customer/orders/{id}/disputes','get','listOwnOrderDisputes','Khiếu nại','DisputePage',query=pagination)
add('/api/customer/orders/{id}/disputes','post','openOwnOrderDispute','Khiếu nại','Dispute','DisputeOpenInput',created=True)
add('/api/admin/disputes','get','adminListDisputes','Khiếu nại','DisputePage',query={**pagination,'status':dispute_state})
add('/api/admin/disputes/{id}','get','adminGetDispute','Khiếu nại','Dispute')
add('/api/admin/disputes/{id}/review','post','adminReviewDispute','Khiếu nại','Dispute','DisputeReviewInput')
for action in ('resolve','reject'):add('/api/admin/disputes/{id}/'+action,'post','admin'+action.title()+'Dispute','Khiếu nại','Dispute','DisputeCloseInput')
add('/api/admin/reports/overview','get','adminReportOverview','Thống kê','ReportOverview',query=dates)
add('/api/admin/reports/materials','get','adminReportMaterials','Thống kê','MaterialReportPage',query={**dates,**pagination,'materialId':ident})
add('/api/admin/reports/collectors','get','adminReportCollectors','Thống kê','CollectorReportPage',query={**dates,**pagination,'collectorId':ident})

references=0
def validate(value):
    global references
    if isinstance(value,dict):
        if '$ref' in value and value['$ref'].startswith('#/'):
            target=spec
            for part in value['$ref'][2:].split('/'):target=target[part.replace('~1','/').replace('~0','~')]
            references+=1
        if value.get('type')=='object' and 'properties' in value:assert set(value.get('required',[]))<=set(value['properties'])
        for child in value.values():validate(child)
    elif isinstance(value,list):
        for child in value:validate(child)
validate(spec)
operations=[operation['operationId'] for path in spec['paths'].values() for method,operation in path.items() if method in ('get','post','put','patch','delete')]
assert len(operations)==len(set(operations)), 'Duplicate operationId'
write('backend-completion-openapi.json',spec)
print(f'Parsed contract: {len(spec["paths"])} paths, {len(operations)} unique operations, {references} resolved local references. This is not an external OpenAPI lint run.')
