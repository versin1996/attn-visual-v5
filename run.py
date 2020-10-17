from flask import Flask, render_template, request, jsonify
from waitress import serve

from view import index
from data_process import load_json
from settings import TEXT_SIZE
import json
import argparse
import requests
import socket
import os


data_dir = ''
cols = 0

parser =  argparse.ArgumentParser(description='Attention Visual')
parser.add_argument('-p', '--port', type=int, required=True, help='Port')
parser.add_argument('-f', '--path', type=str, required=True, help='File path')
parser.add_argument('-t', '--textsize', type=int, default=16, help='Text size')
parser.add_argument('-n', '--topnum', type=int, default=20, help='Top count')
parser.add_argument('-c', '--cols', type=int, default=2, help='Column count')
parser.add_argument('-l', '--language', type=str, default='ch', help='Language')
args = parser.parse_args()

app = Flask(__name__)
app.DEBUG = True
app.jinja_env.auto_reload = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.add_url_rule('/', 'index', index)

@app.route('/get_index',methods=['GET','POST'])
def get_index():
    data = {'cols': cols, 'heads': heads, 'files': files}
    return json.dumps(data)

@app.route('/post',methods=['GET','POST'])
def get_data():
    head = request.form['head']
    file = request.form['file']
    path = os.path.join(data_dir, head, file)
    sentences, tokens, top, top_length, roles_length = load_json(path, args.topnum, args.language) ##          

    data = {
    	'sentences': sentences, 
        'tokens': tokens,
    	'top': top, 
        'top_length': top_length,
    	'TEXT_SIZE': args.textsize, 
    	'roles_length': roles_length,
        'language': args.language
    }
    return json.dumps(data)


def get_ip_address():
    """
    查询本机ip地址
    :return: ip
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

def ip_map(ip):
	if ip == '192.168.53.6':
		return '172.29.170.70'
	elif ip == '192.168.53.11':
		return '172.29.176.125'
	elif ip == '192.168.53.5':
		return '172.29.143.15'

if __name__ == '__main__':
    data_dir = args.path
    cols = args.cols
    heads = sorted(os.listdir(data_dir), key=lambda x: (int(x.split('_')[0]), int(x.split('_')[1])))
    print(heads)
    files = {}
    for head in heads:
        files[head] = sorted(os.listdir(os.path.join(data_dir, head)))
    ip = get_ip_address()
    print('Serving on http://{}:{}'.format(ip, args.port))
    print('Serving on http://{}:{}'.format(ip_map(ip), args.port))
    # serve(app, port=args.port)
    app.run(debug=True) ##

# python /nas/versin/attn-visual-v4/run.py -p 5002 -f /nas/lishengping/datas/temp_atte_json/lsp-back/ -t 12 -c 3
# python /nas/versin/attn-visual-v4/run.py -p 5002 -f /nas/lishengping/datas/temp_atte_json/lsp_10per/ -t 16 -c 3
# python /nas/versin/attn-visual-v4/run.py -p 5002 -f /nas/lishengping/datas/temp_atte_json/lsp_short_headers/ -t 14 -c 3 -n 10
# python run.py -p 5002 -f C:\Users\86135\Desktop\Front-End\data -t 14 -c 3 -n 10 -l ch
# python run.py -p 5002 -f C:\Users\86135\Desktop\Front-End\attn-visual-v5\test\data -t 14 -c 3 -n 10 -l en
# python /nas/versin/attn-visual-v5/run.py -p 5002 -f /nas/lishengping/datas/temp_atte_json/lsp_short_headers/ -t 14 -c 3 -n 10
# python /nas/versin/attn-visual-v5/run.py -p 5002 -f /nas/versin/attn-visual-v5/test/data/ -t 14 -c 3 -n 10 -l en