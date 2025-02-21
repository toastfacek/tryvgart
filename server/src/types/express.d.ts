// This file can be deleted since we're using @types/express 

declare module 'express' {
  import { Request, Response } from 'express-serve-static-core'
  export { Request, Response }
  const express: any
  export default express
} 