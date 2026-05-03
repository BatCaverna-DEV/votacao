const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL ?? ''

export const fotoUrl = (foto) => foto ? `${UPLOADS_URL}${foto}` : null
