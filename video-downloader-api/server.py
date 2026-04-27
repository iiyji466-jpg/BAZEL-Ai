from flask import Flask, request, jsonify
import yt_dlp, os

app = Flask(__name__)

@app.route('/download', methods=['POST'])
def download():
    url = request.json.get('url')
    if not url:
        return jsonify({'error': 'URL مطلوب'}), 400
    try:
        with yt_dlp.YoutubeDL({'quiet': True, 'format': 'best'}) as ydl:
            info = ydl.extract_info(url, download=False)
            return jsonify({
                'title': info.get('title'),
                'url': info.get('url'),
                'thumbnail': info.get('thumbnail'),
            })
    except:
        return jsonify({'error': 'تعذر جلب الفيديو'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
