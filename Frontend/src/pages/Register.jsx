import React, { useState, memo, useCallback, useMemo } from 'react';
import axios from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const validateEmail = (email) => /.+@.+\..+/.test(email);
const validatePassword = (password) => password.length >= 6;
const validateName = (name) => {
  const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]+$/;
  return name.trim().length > 0 && nameRegex.test(name.trim());
};

const Register = memo(() => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '', // Add this
    password: '',
    confirmPassword: '', // Add password confirmation
    role: 'regular',
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }, []);

  const handleBlur = useCallback((e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  }, []);

  // Memoize validation functions to prevent recreation
  const validateEmailMatch = useMemo(() => (email, confirmEmail) => {
    return email === confirmEmail && email.length > 0;
  }, []);

  const validatePasswordMatch = useMemo(() => (password, confirmPassword) => {
    return password === confirmPassword && password.length > 0;
  }, []);

  // Memoize validations to prevent unnecessary recalculations
  const validations = React.useMemo(() => {
    const isEmailValid = validateEmail(form.email);
    const isPasswordValid = validatePassword(form.password);
    const isFirstNameValid = validateName(form.firstName);
    const isLastNameValid = validateName(form.lastName);
    const doEmailsMatch = validateEmailMatch(form.email, form.confirmEmail);
    const doPasswordsMatch = validatePasswordMatch(form.password, form.confirmPassword);
    
    return {
      isEmailValid,
      isPasswordValid,
      isFirstNameValid,
      isLastNameValid,
      doEmailsMatch,
      doPasswordsMatch,
      canSubmit: isFirstNameValid && isLastNameValid && isEmailValid && isPasswordValid && doEmailsMatch && doPasswordsMatch && form.role
    };
  }, [form, validateEmailMatch, validatePasswordMatch]);

  const { isEmailValid, isPasswordValid, isFirstNameValid, isLastNameValid, doEmailsMatch, doPasswordsMatch, canSubmit } = validations;

  // Memoize static classes
  const inputBaseClass = useMemo(() => 
    "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
    []
  );

  const errorInputClass = useMemo(() => 
    "border-2 border-red-500 focus:border-red-500 focus:ring-red-500",
    []
  );

  const buttonClass = useMemo(() =>
    "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-300 transform hover:scale-105",
    []
  );

  // Memoize loading spinner
  const loadingSpinner = useMemo(() => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, confirmEmail: true, password: true, confirmPassword: true }); // Add confirmPassword
    if (!canSubmit) return;
    
    // Add email validation check
    if (!doEmailsMatch) {
      setError('Los correos electrónicos no coinciden.');
      return;
    }
    
    // Add password validation check
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
        email: form.email, // Only send email, not confirmEmail
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-300 hover:scale-[1.01]">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-white">Registro</h2>
          <p className="mt-2 text-center text-sm text-gray-400">Crea tu cuenta para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto" aria-label="Formulario de registro" >
          <div className="mb-2">
            <Label htmlFor="firstName" className="block text-sm font-medium text-gray-200 mb-1">Nombre</Label>
            <Input
              type="text"
              name="firstName"
              id="firstName"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!isFirstNameValid && touched.firstName}
              aria-describedby="firstName-error"
              className={cn(
                inputBaseClass,
                touched.firstName && !isFirstNameValid && errorInputClass
              )}
              placeholder="Tu nombre"
              autoComplete="given-name"
            />
            {touched.firstName && !isFirstNameValid && (
              <div id="firstName-error" className="text-red-400 text-sm animate-fade-in mt-1">
                El nombre es obligatorio y solo puede contener letras, espacios, guiones y apostrofes.
              </div>
            )}
          </div>
          <div className="mb-2">
            <Label htmlFor="lastName" className="block text-sm font-medium text-gray-200 mb-1">Apellido</Label>
            <Input
              type="text"
              name="lastName"
              id="lastName"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!isLastNameValid && touched.lastName}
              aria-describedby="lastName-error"
              className={cn(
                "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
                touched.lastName && !isLastNameValid && "border-2 border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Tu apellido"
              autoComplete="family-name"
            />
            {touched.lastName && !isLastNameValid && (
              <div id="lastName-error" className="text-red-400 text-sm animate-fade-in mt-1">
                El apellido es obligatorio y solo puede contener letras, espacios, guiones y apostrofes.
              </div>
            )}
          </div>
          <div className="mb-2">
            <Label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">Email</Label>
            <Input
              type="email"
              name="email"
              id="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!isEmailValid && touched.email}
              aria-describedby="email-error"
              className={cn(
                "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
                touched.email && !isEmailValid && "border-2 border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="tu@ejemplo.com"
              autoComplete="email"
            />
            {touched.email && !isEmailValid && (
              <div id="email-error" className="text-red-400 text-sm animate-fade-in mt-1">Email inválido.</div>
            )}
          </div>

          {/* Add email confirmation field */}
          <div className="mb-2">
            <Label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-200 mb-1">Confirma tu Email</Label>
            <Input
              type="email"
              name="confirmEmail"
              id="confirmEmail"
              value={form.confirmEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!doEmailsMatch && touched.confirmEmail}
              aria-describedby="confirmEmail-error"
              className={cn(
                "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
                touched.confirmEmail && !doEmailsMatch && "border-2 border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Ingresa tu email nuevamente"
              autoComplete="email"
            />
            {touched.confirmEmail && form.confirmEmail.length > 0 && !doEmailsMatch && (
              <div id="confirmEmail-error" className="text-red-400 text-sm animate-fade-in mt-1">
                Los correos electrónicos no coinciden.
              </div>
            )}
            {form.confirmEmail.length > 0 && doEmailsMatch && (
              <div className="text-green-400 text-sm animate-fade-in mt-1">
                ✓ Los correos coinciden
              </div>
            )}
          </div>
          <div className="mb-2">
            <Label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">Contraseña</Label>
            <Input
              type="password"
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!isPasswordValid && touched.password}
              aria-describedby="password-error"
              className={cn(
                "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
                touched.password && !isPasswordValid && "border-2 border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Tu contraseña"
              autoComplete="new-password"
            />
            {touched.password && !isPasswordValid && (
              <div id="password-error" className="text-red-400 text-sm animate-fade-in mt-1">La contraseña debe tener al menos 6 caracteres.</div>
            )}
          </div>

          {/* Add password confirmation field */}
          <div className="mb-2">
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200 mb-1">Confirma tu Contraseña</Label>
            <Input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={!doPasswordsMatch && touched.confirmPassword}
              aria-describedby="confirmPassword-error"
              className={cn(
                "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
                touched.confirmPassword && !doPasswordsMatch && "border-2 border-red-500 focus:border-red-500 focus:ring-red-500"
              )}
              placeholder="Ingresa tu contraseña nuevamente"
              autoComplete="new-password"
            />
            {touched.confirmPassword && form.confirmPassword.length > 0 && !doPasswordsMatch && (
              <div id="confirmPassword-error" className="text-red-400 text-sm animate-fade-in mt-1">
                Las contraseñas no coinciden.
              </div>
            )}
            {form.confirmPassword.length > 0 && doPasswordsMatch && (
              <div className="text-green-400 text-sm animate-fade-in mt-1">
                ✓ Las contraseñas coinciden
              </div>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="role" className="block text-sm font-medium text-gray-200 mb-1">Rol</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm({ ...form, role: value })}
            >
              <SelectTrigger className="w-full bg-gray-700 text-white border border-gray-600 rounded-md">
                <SelectValue placeholder="Selecciona el rol" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border border-gray-600">
                <SelectItem value="regular">Usuario Regular</SelectItem>
                <SelectItem value="lawyer">Abogado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <div className="mb-2 bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded animate-fade-in" role="alert">{error}</div>}
          {success && <div className="mb-2 bg-green-900/20 border border-green-700 text-green-300 px-4 py-3 rounded animate-fade-in" role="status">{success}</div>}
          <Button
            type="submit"
            className={cn(
              buttonClass,
              loading && "opacity-50 cursor-not-allowed"
            )}
            disabled={loading || !canSubmit}
            aria-busy={loading}
          >
            {loading ? loadingSpinner : null}
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
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

Register.displayName = 'Register';

export default Register;