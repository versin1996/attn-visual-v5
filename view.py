from flask import render_template, request, jsonify


def index():
	return render_template('index.html')