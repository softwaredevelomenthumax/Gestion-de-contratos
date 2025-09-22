const nodemailer = require('nodemailer');
require('dotenv').config({ path: __dirname + '/.env' });

// Email service for sending notifications
class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.FROM_EMAIL || 'it.latam@valeant.com';
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || '161.242.68.103',
        port: parseInt(process.env.SMTP_PORT) || 25,
        secure: false, // true for 465, false for other ports
        auth: false, // No authentication required for your SMTP server
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      console.log('✅ Email service initialized successfully');
      console.log('📧 SMTP Configuration:', {
        host: process.env.SMTP_HOST || '161.242.68.103',
        port: parseInt(process.env.SMTP_PORT) || 25,
        from: this.fromEmail
      });
    } catch (error) {
      console.error('❌ Error initializing email service:', error);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        console.error('❌ Email transporter not initialized');
        return { success: false, error: 'Email service not available' };
      }

      const mailOptions = {
        from: `"Sistema de Gestión de Contratos" <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      console.log('📤 Sending email:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      });

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Contract-related email templates
  async sendContractCreatedNotification(userEmail, contractData) {
    const subject = `Nuevo contrato creado - ${contractData.descripcion}`;
    const html = this.getContractCreatedTemplate(contractData);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendContractStatusChangeNotification(userEmail, contractData, oldStatus, newStatus) {
    const subject = `Actualización de contrato - ${contractData.descripcion}`;
    const html = this.getContractStatusChangeTemplate(contractData, oldStatus, newStatus);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendContractActionRequiredNotification(userEmail, contractData, action, userRole) {
    const actionTexts = {
      'review': 'revisión',
      'respond': 'respuesta',
      'sign': 'firma',
      'approval': 'aprobación'
    };
    
    const actionText = actionTexts[action] || action;
    const subject = `Acción requerida: ${actionText} - ${contractData.descripcion}`;
    const html = this.getContractActionRequiredTemplate(contractData, actionText, userRole);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendContractSentToLawyerNotification(userEmail, contractData) {
    const subject = `Nuevo contrato enviado para revisión - ${contractData.descripcion}`;
    const html = this.getContractSentToLawyerTemplate(contractData);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendUserRegistrationNotification(userEmail, userData) {
    const subject = 'Registro exitoso - Sistema de Gestión de Contratos';
    const html = this.getUserRegistrationTemplate(userData);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendUserApprovalNotification(userEmail, userData) {
    const subject = 'Cuenta aprobada - Sistema de Gestión de Contratos';
    const html = this.getUserApprovalTemplate(userData);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendUserRejectionNotification(userEmail, userData) {
    const subject = 'Actualización de registro - Sistema de Gestión de Contratos';
    const html = this.getUserRejectionTemplate(userData);
    
    return await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }

  async sendAdminNewUserNotification(adminEmails, userData) {
    const subject = 'Nuevo usuario pendiente de aprobación';
    const html = this.getAdminNewUserTemplate(userData);
    
    return await this.sendEmail({
      to: adminEmails,
      subject,
      html
    });
  }

  // Email templates
  getContractCreatedTemplate(contractData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">✅ Contrato Creado Exitosamente</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Detalles del Contrato</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">ID:</td>
                <td style="padding: 8px 0;">${contractData.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Descripción:</td>
                <td style="padding: 8px 0;">${contractData.descripcion}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Proveedor:</td>
                <td style="padding: 8px 0;">${contractData.proveedor}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Descripción:</td>
                <td style="padding: 8px 0;">${contractData.descripcion || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Estado:</td>
                <td style="padding: 8px 0;"><span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">NUEVO</span></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #065f46;">
              <strong>Próximo paso:</strong> Su contrato ha sido enviado para revisión legal. Recibirá una notificación cuando requiera alguna acción de su parte.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getContractStatusChangeTemplate(contractData, oldStatus, newStatus) {
    const statusTexts = {
      'new': 'Nuevo',
      'awaiting_lawyer_review': 'Esperando revisión legal',
      'awaiting_user_response': 'Esperando respuesta del usuario',
      'awaiting_signature': 'Esperando firma del usuario',
      'signed': 'Firmado por ambas partes',
      'signature_otrosi_already_signedByUser': 'Otrosí firmado por usuario - Esperando aprobación del abogado',
      'otrosi_awaiting_lawyer_review': 'Otrosí esperando revisión legal',
      'otrosi_awaiting_user_response': 'Otrosí esperando respuesta del usuario',
      'otrosi_awaiting_signature': 'Otrosí esperando firma',
      'otrosi_signed': 'Otrosí firmado'
    };

    const oldStatusText = statusTexts[oldStatus] || oldStatus;
    const newStatusText = statusTexts[newStatus] || newStatus;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">🔄 Estado del Contrato Actualizado</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Contrato: ${contractData.descripcion}</h3>
            <p style="color: #6b7280; margin-bottom: 15px;">Radicado: ${contractData.id}</p>
            
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <span style="background-color: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 4px; font-size: 14px;">${oldStatusText}</span>
              <span style="margin: 0 15px; color: #6b7280;">→</span>
              <span style="background-color: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 4px; font-size: 14px;">${newStatusText}</span>
            </div>
          </div>
          
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af;">
              <strong>Información:</strong> El estado de su contrato ha sido actualizado. Revise los detalles en el sistema para conocer los próximos pasos.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getContractActionRequiredTemplate(contractData, actionText, userRole) {
    const roleTexts = {
      'regular': 'usuario',
      'lawyer': 'abogado',
      'admin': 'administrador'
    };

    const roleText = roleTexts[userRole] || userRole;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ Acción Requerida</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Contrato: ${contractData.descripcion}</h3>
            <p style="color: #6b7280; margin-bottom: 15px;">Radicado: ${contractData.id}</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 15px;">
              <p style="margin: 0; color: #92400e;">
                <strong>Acción requerida:</strong> Se requiere su ${actionText} como ${roleText} para continuar con el proceso del contrato.
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Proveedor:</td>
                <td style="padding: 8px 0;">${contractData.proveedor}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Descripción:</td>
                <td style="padding: 8px 0;">${contractData.descripcion || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #065f46;">
              <strong>Próximo paso:</strong> Ingrese al sistema para revisar los detalles del contrato y realizar la acción correspondiente.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getUserRegistrationTemplate(userData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">🎉 Registro Exitoso</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin-bottom: 15px;">Hola <strong>${userData.firstName} ${userData.lastName}</strong>,</p>
            
            <p style="color: #6b7280; margin-bottom: 15px;">
              Su registro en el Sistema de Gestión de Contratos ha sido exitoso.
            </p>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 15px;">
              <p style="margin: 0; color: #92400e;">
                <strong>Estado actual:</strong> Su cuenta está pendiente de aprobación por un administrador. Recibirá una notificación por correo cuando su cuenta sea aprobada.
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;">${userData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Rol:</td>
                <td style="padding: 8px 0;">${userData.role === 'regular' ? 'Usuario Regular' : userData.role === 'lawyer' ? 'Abogado' : 'Administrador'}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getUserApprovalTemplate(userData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">✅ Cuenta Aprobada</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin-bottom: 15px;">Hola <strong>${userData.firstName} ${userData.lastName}</strong>,</p>
            
            <p style="color: #6b7280; margin-bottom: 15px;">
              ¡Excelentes noticias! Su cuenta en el Sistema de Gestión de Contratos ha sido aprobada.
            </p>
            
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 15px;">
              <p style="margin: 0; color: #065f46;">
                <strong>¡Ya puede acceder al sistema!</strong> Use sus credenciales de registro para iniciar sesión y comenzar a gestionar contratos.
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;">${userData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Rol:</td>
                <td style="padding: 8px 0;">${userData.role === 'regular' ? 'Usuario Regular' : userData.role === 'lawyer' ? 'Abogado' : 'Administrador'}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getUserRejectionTemplate(userData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-bottom: 20px;">❌ Actualización de Registro</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin-bottom: 15px;">Hola <strong>${userData.firstName} ${userData.lastName}</strong>,</p>
            
            <p style="color: #6b7280; margin-bottom: 15px;">
              Lamentamos informarle que su solicitud de registro en el Sistema de Gestión de Contratos no ha sido aprobada en esta ocasión.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 15px;">
              <p style="margin: 0; color: #991b1b;">
                <strong>Información:</strong> Si considera que esto es un error o necesita más información, por favor contacte al administrador del sistema.
              </p>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getAdminNewUserTemplate(userData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #f59e0b; margin-bottom: 20px;">👤 Nuevo Usuario Pendiente</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #374151; margin-bottom: 15px;">Se ha registrado un nuevo usuario en el sistema que requiere aprobación.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Nombre:</td>
                <td style="padding: 8px 0;">${userData.firstName} ${userData.lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;">${userData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Rol solicitado:</td>
                <td style="padding: 8px 0;">${userData.role === 'regular' ? 'Usuario Regular' : userData.role === 'lawyer' ? 'Abogado' : 'Administrador'}</td>
              </tr>
            </table>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px;">
              <p style="margin: 0; color: #92400e;">
                <strong>Acción requerida:</strong> Ingrese al panel de administración para aprobar o rechazar esta solicitud.
              </p>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  getContractSentToLawyerTemplate(contractData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">📋 Nuevo Contrato Enviado para Revisión</h2>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Detalles del Contrato</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">ID:</td>
                <td style="padding: 8px 0;">${contractData.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Descripción:</td>
                <td style="padding: 8px 0;">${contractData.descripcion}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Proveedor:</td>
                <td style="padding: 8px 0;">${contractData.proveedor}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Descripción:</td>
                <td style="padding: 8px 0;">${contractData.descripcion || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Estado:</td>
                <td style="padding: 8px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">NUEVO</span></td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e;">
              <strong>Acción requerida:</strong> Un nuevo contrato ha sido enviado para su revisión legal. Por favor, revise los detalles y tome la acción correspondiente en el sistema.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Este es un mensaje automático del Sistema de Gestión de Contratos.
          </p>
        </div>
      </div>
    `;
  }

  // Test email functionality
  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Transporter not initialized' };
      }

      await this.transporter.verify();
      console.log('✅ Email service connection test successful');
      return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
