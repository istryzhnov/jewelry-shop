import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req }) => Boolean(req.user)

export const isAdminField: FieldAccess = ({ req }) => Boolean(req.user)

// Visitors see only published documents; admins see everything
export const publishedOrAdmin: Access = ({ req }) =>
  req.user ? true : { status: { equals: 'published' } }
