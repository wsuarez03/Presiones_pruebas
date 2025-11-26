import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import json

def handler(request, response):
    try:
        data = request.json()

        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        smtp_user = "TU_CORREO@gmail.com"
        smtp_pass = "TU_CONTRASEÑA_DE_APLICACION"

        # Construcción del correo
        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = "DESTINO@correo.com"
        msg["Subject"] = f"Resultados de prueba – {data.get('tag')}"

        html = f"""
        <h2>Resultados de la prueba de presiones</h2>
        <p><strong>Cliente:</strong> {data.get('cliente')}</p>
        <p><strong>TAG:</strong> {data.get('tag')}</p>
        <p><strong>Set Point:</strong> {data.get('set')}</p>
        <p><strong>Sección:</strong> {data.get('seccion')}</p>
        <p><strong>Tipo prueba:</strong> {data.get('tipo')}</p>
        <p><strong>Manómetro:</strong> {data.get('manometro')}</p>
        <p><strong>Promedio:</strong> {data.get('promedio')}</p>

        <h3>Presiones registradas</h3>
        <ul>
            {''.join(f'<li>{p}</li>' for p in data.get("presiones", []))}
        </ul>

        <p><strong>Fecha:</strong> {data.get('fecha')}</p>
        """

        msg.attach(MIMEText(html, "html"))

        # Envío real con Gmail
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()

        return response.json({ "status": "ok" })

    except Exception as e:
        return response.json({ "status": "error", "msg": str(e) })
