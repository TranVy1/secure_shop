import json

with open('eslint-report.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
with open('eslint_output.txt', 'w', encoding='utf-8') as out:
    for file_obj in data:
        if file_obj.get('messages'):
            out.write(file_obj['filePath'] + '\n')
            for msg in file_obj['messages']:
                out.write(f"  {msg['line']}:{msg['column']} - {msg['ruleId']} ({msg['severity']}) - {msg['message']}\n")
