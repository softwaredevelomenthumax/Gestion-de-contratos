import React, { useState, memo, useCallback, useMemo } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import OptimizedInput from '../components/OptimizedInput';

// Move validation functions outside component to prevent recreation
const validateEmail = (email) => /.+@.+\..+/.test(email);
const validatePassword = (password) => password.length >= 6;
const validateName = (name) => {
  const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/;
  return name.trim().length > 0 && nameRegex.test(name.trim());
};

const RegisterOptimized = memo(() => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: '',
    role: 'regular',
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Memoize event handlers
  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }, []);

  const handleBlur = useCallback((e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  }, []);

  const handleRoleChange = useCallback((value) => {
    setForm(prev => ({ ...prev, role: value }));
  }, []);

  // Memoize validation results
  const validations = useMemo(() => {
    const isEmailValid = validateEmail(form.email);
    const isPasswordValid = validatePassword(form.password);
    const isFirstNameValid = validateName(form.firstName);
    const isLastNameValid = validateName(form.lastName);
    const doEmailsMatch = form.email === form.confirmEmail && form.email.length > 0;
    const doPasswordsMatch = form.password === form.confirmPassword && form.password.length > 0;
    
    return {
      isEmailValid,
      isPasswordValid,
      isFirstNameValid,
      isLastNameValid,
      doEmailsMatch,
      doPasswordsMatch,
      canSubmit: isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && doEmailsMatch && doPasswordsMatch && form.role
    };
  }, [form]);

  const { isEmailValid, isPasswordValid, isFirstNameValid, isLastNameValid, doEmailsMatch, doPasswordsMatch, canSubmit } = validations;

  // Memoize styles
  const styles = useMemo(() => ({
    container: "min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8",
    card: "max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-300 hover:scale-[1.01]",
    form: "space-y-6 w-full max-w-md mx-auto",
    button: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-300 transform hover:scale-105",
    successMessage: "mb-2 bg-green-900/20 border border-green-700 text-green-300 px-4 py-3 rounded animate-fade-in",
    errorMessage: "mb-2 bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded animate-fade-in"
  }), []);

  // Memoize loading spinner
  const loadingSpinner = useMemo(() => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setTouched({ 
      firstName: true, 
      lastName: true, 
      email: true, 
      confirmEmail: true, 
      password: true, 
      confirmPassword: true 
    });
    
    if (!canSubmit) return;
    
    if (!doEmailsMatch) {
      setError('Los correos electrónicos no coinciden.');
      return;
    }
    
    if (!doPasswordsMatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await axios.post('/login/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role
      });
      
      if (res.data.success) {
        setSuccess('Registro exitoso. Redirigiendo al login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(res.data.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }, [canSubmit, doEmailsMatch, doPasswordsMatch, form, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">Registro</h2>
          <p className="mt-2 text-center text-sm text-gray-400">Crea tu cuenta para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form} aria-label="Formulario de registro">
          <OptimizedInput
            id="firstName"
            name="firstName"
            type="text"
            label="Nombre"
            value={form.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Tu nombre"
            autoComplete="given-name"
            isValid={isFirstNameValid}
            isTouched={touched.firstName}
            errorMessage="El nombre es obligatorio y solo puede contener letras, espacios, guiones y apostrofes."
          />

          <OptimizedInput
            id="lastName"
            name="lastName"
            type="text"
            label="Apellido"
            value={form.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Tu apellido"
            autoComplete="family-name"
            isValid={isLastNameValid}
            isTouched={touched.lastName}
            errorMessage="El apellido es obligatorio y solo puede contener letras, espacios, guiones y apostrofes."
          />

          <OptimizedInput
            id="email"
            name="email"
            type="email"
            label="Email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="tu@ejemplo.com"
            autoComplete="email"
            isValid={isEmailValid}
            isTouched={touched.email}
            errorMessage="Email inválido."
          />

          <OptimizedInput
            id="confirmEmail"
            name="confirmEmail"
            type="email"
            label="Confirma tu Email"
            value={form.confirmEmail}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ingresa tu email nuevamente"
            autoComplete="email"
            isValid={doEmailsMatch}
            isTouched={touched.confirmEmail}
            errorMessage="Los correos electrónicos no coinciden."
            successMessage="✓ Los correos coinciden"
          />

          <OptimizedInput
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Tu contraseña"
            autoComplete="new-password"
            isValid={isPasswordValid}
            isTouched={touched.password}
            errorMessage="La contraseña debe tener al menos 6 caracteres."
          />

          <OptimizedInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirma tu Contraseña"
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ingresa tu contraseña nuevamente"
            autoComplete="new-password"
            isValid={doPasswordsMatch}
            isTouched={touched.confirmPassword}
            errorMessage="Las contraseñas no coinciden."
            successMessage="✓ Las contraseñas coinciden"
          />

          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-200 mb-1">Rol</label>
            <Select value={form.role} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full bg-gray-700 text-white border border-gray-600 rounded-md">
                <SelectValue placeholder="Selecciona el rol" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border border-gray-600">
                <SelectItem value="regular">Usuario Regular</SelectItem>
                <SelectItem value="lawyer">Abogado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <div className={styles.errorMessage} role="alert">{error}</div>}
          {success && <div className={styles.successMessage} role="status">{success}</div>}
          
          <Button
            type="submit"
            className={cn(styles.button, loading && "opacity-50 cursor-not-allowed")}
            disabled={loading || !canSubmit}
            aria-busy={loading}
          >
            {loading && loadingSpinner}
            {loading ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-400 hover:underline font-medium">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
});

RegisterOptimized.displayName = 'RegisterOptimized';

export default RegisterOptimized;
