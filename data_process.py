import json
from settings import TOP_NUM


def load_json(file_path, top_num, language):
	data, tokens, break_points, top_temp = merge_data(file_path, top_num)
	result = divide_data(data, break_points)
	roles_length = get_max_role_length(result, language)
	top, top_length = get_top(top_temp, result, language)
	return result, tokens, top, top_length, roles_length

def merge_data(file_path, top_num):
	result = {}
	top = []
	with open(file_path, 'r', encoding='utf-8') as f:
		data = json.load(f)
		for i, char in enumerate(data['tokens']):
			result[i] = [char]
		for i in data['top_sumv_norms']:
			result[i[0]].append(i[1:])
		for k, v in result.items():
			if len(v) == 1:
				result[k].append([])
		for k, v in data['vnorm_distributions'].items():
			result[int(k)].append(v)
		for k, v in result.items():
			if len(v) == 2:
				result[k].append([])
		result = list(result.items())
		temp = [i for i in result if i[1][1]]
		top = sorted(temp, key=lambda d: d[1][1][0], reverse=True)[:top_num]
		for i in range(len(top)):
			top[i][1][1][0] = round(top[i][1][1][0], 2)
		scores = [i[1][1][0] for i in result if i[1][1]]
		distances = [i[1][1][1] for i in result if i[1][1]]
		attn_scores = []
		for ch in result:
			attn_scores += [i[1] for i in ch[1][2] if ch[1][2]]
		scores_max = max(scores)
		distance_max = max(distances)
		attn_score_max = max(attn_scores)
		# print(scores_max, distance_max, attn_score_max)
		for i in range(len(result)):
			if result[i][1][1]:
				result[i][1][1][0] = result[i][1][1][0] / scores_max
				result[i][1][1][1] = result[i][1][1][1] / distance_max
			else:
				result[i][1][1] = [0, 0]
			if result[i][1][2]:
				for j in range(len(result[i][1][2])):
					result[i][1][2][j][1] = result[i][1][2][j][1] / attn_score_max
		return result, data['tokens'], data['break_points'], top

	
def divide_data(data, break_points):
	result = []
	temp = []
	slice_start = -1
	for slice_end in break_points:
		temp.append(data[slice_start+1:slice_end+1])
		slice_start = slice_end
	temp.append(data[slice_start+1:])
	for i in temp:
		colon_index = find_colon(i)
		if colon_index != -1:
			role = get_length(i[:colon_index])
			sentence = get_length(i[colon_index:])
			result.append([role, sentence])
		else:
			if i == temp[0]:
				result.append([[], get_length(i)])
			else:
				result.append([get_length(i), []])
	return result

def is_chinese(uchar):
	if uchar >= u'\u4e00' and uchar<=u'\u9fff':
		return True
	elif uchar >= u'\u0020' and uchar<=u'\u007f':
		return True
	elif uchar >= u'\u2000' and uchar<=u'\u3000':
		return True
	elif uchar >= u'\u3000' and uchar<=u'\u303f':
		return True
	elif uchar >= u'\uff00' and uchar<=u'\uffef':
		return True
	else:
		return False

def find_colon(sentence):
	for i, s in enumerate(sentence):
		if s[1][0] == '：':
			return i
	return -1

def get_length(data):
	for i in range(len(data)):
		if len(data[i][1][0]) == 1 and is_chinese(data[i][1][0]):
			length = 2
		else:
			length = len(data[i][1][0])
		data[i][1].append(length)  # data[x][i][1][3] 文本长度
		data[i][1].append(0)  # data[x][i][1][4] 起始位置position
		data[i][1].append(0)  # data[x][i][1][5] 起始行数raw
	return data

def get_max_role_length(data, language):
	if language == 'en':
		lengths = [sum([k[1][3] for k in i[0]]) + len(i[0]) - 1 for i in data]
	else:
		lengths = [sum([k[1][3] for k in i[0]]) for i in data]
	return max(lengths)
	
def get_top(top_temp, data, language):
	temp = []
	for i in data:
		temp += i[0]
		temp += i[1]
	temp.sort()
	top_temp = sorted([i[0] for i in top_temp])
	result = [temp[i] for i in top_temp]
	if language == 'en':
		length = sum([len(i[1][0]) for i in result]) + len(result) - 1
	else:
		length = sum([len(i[1][0]) for i in result])
	return result, length


if __name__ == '__main__':
	pass