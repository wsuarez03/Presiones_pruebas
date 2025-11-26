# app.py
import os
from flask import Flask, request, jsonify
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

app = Flask(__name__)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")        # tu correo gmail
SMTP_PASS = os.getenv("SMTP_PASS")        # contraseña de aplicación (app password)
DESTINATARIOS = os.getenv("DESTINATARIOS", "tecnicodeservicios@valserindustriales.com").split(",")

def construir_html(pruebas):
    # encabezado
    html = """
    <html>
    <body>
    <p>Hola Valser,</p>
    <p>Estas son las pruebas aprobadas:</p>
    <hr/>
    """
    # cada prueba
    for i, p in enumerate(pruebas, start=1):
        fecha = p.get('fecha') or datetime.now().strftime("%d/%m/%Y, %I:%M:%S %p")
        cliente = p.get('cliente', '')
        tag = p.get('tag', '')
        setp = p.get('set', '')
        seccion = p.get('seccion', '')
        tipo = p.get('tipo', '')
        manometro = p.get('manometro', '')
        presiones = p.get('presiones', [])
        promedio = p.get('promedio', None)
        desviacionTotal = p.get('desviacionTotal', None)

        html += f"<h4>#{i} - {fecha}</h4>"
        html += f"<p><strong>Cliente:</strong> {cliente}<br>"
        html += f"<strong>Tag:</strong> {tag}<br>"
        html += f"<strong>Set:</strong> {setp} PSI<br>"
        html += f"<strong>Sección:</strong> {seccion}<br>"
        html += f"<strong>Tipo:</strong> {tipo}<br>"
        html += f"<strong>Manómetro:</strong> {manometro}<br>"
        html += f"<strong>Presiones:</strong> {', '.join(map(str, presiones))}<br>"
        if promedio is not None:
            html += f"<strong>Promedio:</strong> {float(promedio):.2f} PSI<br>"
        if desviacionTotal is not None:
            html += f"<strong>Desviación total:</strong> {float(desviacionTotal):.4f} PSI<br>"
        html += "</p><hr/>"

    html += "<p>Saludos.</p></body></html>"
    return html

@app.route("/api/enviar-correo", methods=["POST"])
def enviar_correo():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "msg": "payload vacío"}), 400

        pruebas = data.get("pruebas") or []
        if not pruebas:
            return jsonify({"status": "error", "msg": "no hay pruebas en el payload"}), 400

        # construir HTML
        html = construir_html(pruebas)

        # construir mensaje
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Pruebas aprobadas - Verificación de presiones"
        msg["From"] = SMTP_USER
        msg["To"] = ", ".join(DESTINATARIOS)
        msg.attach(MIMEText(html, "html"))

        # enviar por SMTP
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, DESTINATARIOS, msg.as_string())
        server.quit()

        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
