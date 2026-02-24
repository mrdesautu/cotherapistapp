# Análisis del Flujo de Creación de Usuarios (Mobile)

Este documento detalla el análisis del flujo actual de autenticación y registro de usuarios en la aplicación móvil `dualtherapist`, identificando discrepancias críticas con el backend.

## 1. Flujo Actual (Mobile)

El proceso de registro (`signUp`) en `dualtherapist/src/services/authService.ts` sigue estos pasos:

1.  **Firebase Auth**: Se crea el usuario en Firebase Authentication mediante `createUserWithEmailAndPassword`.
2.  **Update Profile**: Se actualiza el `displayName` en el perfil de Auth.
3.  **Realtime Database (RTDB)**: Se escribe un registro del usuario en la base de datos en tiempo real (path: `users/${uid}`).
    - Datos guardados: `email`, `displayName`, `role: 'therapist'`, `createdAt`, `lastLoginAt`.

```typescript
// dualtherapist/src/services/authService.ts
signUp: async (email, pass, name) => {
    // ...
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    // ...
    const userRef = ref(database, `users/${credential.user.uid}`);
    await set(userRef, { ...newUser });
}
```

## 2. Discrepancia con el Backend

El backend (`backend/src`) utiliza un sistema de autenticación basado en **Firestore** (no Realtime Database) y espera que los usuarios existan en la colección `users` de Firestore para validar tokens en rutas protegidas.

- **Backend Middleware**: `authMiddleware.js` extrae el UID del token y busca el usuario en Firestore usando `User.findById(decoded.id)`.
- **Backend Model**: `UserFirestore.js` estrá configurado para leer de la colección `users` en Firestore via `firebase-admin`.

### Problema Crítico
**Los usuarios creados desde la app móvil NO existen para el backend.**
Al registrarse desde el móvil, el usuario se crea en Auth y RTDB, pero no en Firestore. Cualquier petición subsiguiente al backend que requiera autenticación fallará con un error 401 (`User not found`), ya que el middleware no encontrará el registro en Firestore.

## 3. Recomendaciones de Buenas Prácticas

1.  **Unificar Base de Datos**: Migrar el almacenamiento de usuarios en la app móvil de Realtime Database a **Firestore**, alineándose con el backend.
2.  **Sincronización Automática**: Implementar una Cloud Function (`auth.user().onCreate`) que cree el documento de usuario en Firestore automáticamente al registrarse en Auth, garantizando consistencia independientemente del cliente (web o móvil).
3.  **Validación en Backend**: Si la app móvil usa el SDK de cliente de Firebase Auth para obtener tokens, el backend debe verificar estos ID Tokens (usando `admin.auth().verifyIdToken`) en lugar de esperar JWTs propios, o implementar un endpoint de intercambio de tokens.

## 4. Plan de Pruebas (Test Plan)

Para validar la funcionalidad actual (aislada en el móvil), implementaremos una prueba unitaria usando `jest` que verifique:
1.  Llamada correcta a `createUserWithEmailAndPassword`.
2.  Escritura exitosa en Realtime Database con los datos correctos.
