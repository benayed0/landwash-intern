import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Directly access localStorage to avoid circular dependency
  const token = localStorage.getItem('landwash_token');

  // console.log('🔒 Interceptor: Request to', req.url);
  // console.log('🔒 Interceptor: Token:', token ? `${token.substring(0, 20)}...` : 'No token');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    // console.log('🔒 Interceptor: Added Authorization header');
  }

  return next(req);
};
