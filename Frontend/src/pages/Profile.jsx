import React, { useEffect, useState } from 'react';
import { getProfile } from '../api/profile';
import { useLanguage, displayCountryCode } from '../context/LanguageContext';
import api from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    let mounted = true;
    getProfile().then((data) => {
      if (mounted) setProfile(data.user || data);
    }).catch(() => {}).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!profile) return <div className="p-6">No se encontró información de perfil.</div>;

  const countryCode = displayCountryCode(profile.countryCode || profile.country || '');
  const flagSrc = countryCode ? `/flags/${countryCode.toLowerCase()}.svg` : null;

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!avatarFile) return;
    const FormData = window.FormData;
    const fd = new FormData();
    fd.append('avatar', avatarFile);
    try {
      const res = await import('../api/profile').then(m=>m.updateProfile(fd));
      if (res) {
        // Refresh profile in backend and in AuthContext
        const refreshed = await refreshUser();
        if (refreshed) {
          // Ensure avatar is absolute URL
          let userObj = refreshed;
          if (userObj.avatar && userObj.avatar.startsWith('/uploads')) {
            const origin = api.defaults.baseURL.replace(/\/api$/, '');
            userObj = { ...userObj, avatar: `${origin}${userObj.avatar}` };
          }
          setProfile(userObj);
        }
        setAvatarFile(null);
        setPreview(null);
      }
    } catch (err) {
      console.error('Upload failed', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-gradient-to-r from-white/60 to-white/30 dark:from-gray-800/60 dark:to-gray-800/40 backdrop-blur rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {preview ? (
              <img src={preview} alt="preview" className="h-28 w-28 rounded-full object-cover" />
            ) : profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" className="h-28 w-28 rounded-full object-cover" />
            ) : (
              <div className="h-28 w-28 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">{profile.firstName?.[0] || 'U'}</div>
            )}
            <div className="mt-2 flex gap-2 items-center">
              <input type="file" accept="image/*" id="avatar" onChange={handleFileChange} className="hidden" />
              <label htmlFor="avatar" className="px-3 py-1 rounded-md border cursor-pointer">Seleccionar foto</label>
              <button onClick={handleUpload} className="px-3 py-1 rounded-md bg-blue-600 text-white" disabled={!avatarFile}>Subir</button>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{profile.firstName} {profile.lastName}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
              {flagSrc && <img src={flagSrc} alt={countryCode} className="ml-auto h-8 w-12 object-cover rounded-sm" />}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                <div className="text-xs text-gray-400">Rol</div>
                <div className="font-medium text-lg">{profile.role}</div>
              </div>
              <div className="p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                <div className="text-xs text-gray-400">Idioma</div>
                <div className="font-medium text-lg">{profile.preferredLanguage || '—'}</div>
              </div>
              <div className="p-4 bg-white/60 dark:bg-gray-900/40 rounded-lg">
                <div className="text-xs text-gray-400">País</div>
                <div className="font-medium text-lg">{countryCode || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-400">{t.additionalInfo}</h3>
                <p className="text-sm text-foreground">{t.additionalInfo} — {t.languageLabel}: {profile.preferredLanguage || '—'}</p>
            </div>
            <div className="flex gap-2">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
