import * as Yup from 'yup';

const signupSchema = Yup.object().shape({
    name: Yup.string()
        .required('El nombre es obligatorio'),
    email: Yup.string()
        .email('El email no es válido')
        .required('El email es obligatorio'),
    password: Yup.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .required('La contraseña es obligatoria'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
        .required('La confirmación de la contraseña es obligatoria'),
});

export default signupSchema;
