import { z } from 'zod';

// Các quy tắc khớp với Jakarta Validation ở backend (RegisterRequest / LoginRequest)

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Vui lòng nhập họ và tên')
      .max(100, 'Họ và tên tối đa 100 ký tự'),
    dateOfBirth: z
      .string()
      .min(1, 'Vui lòng chọn ngày sinh')
      .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) < today(), 'Ngày sinh phải là ngày trong quá khứ')
      .refine((v) => new Date(v).getFullYear() >= 1900, 'Ngày sinh không hợp lệ'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
      errorMap: () => ({ message: 'Vui lòng chọn giới tính' }),
    }),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Số điện thoại di động không hợp lệ (VD: 0912345678)'),
    email: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập email để xác thực tài khoản')
      .max(100, 'Email tối đa 100 ký tự')
      .email('Email không đúng định dạng'),
    username: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._]{4,50}$/, 'Gồm 4-50 ký tự: chữ cái không dấu, số, dấu chấm hoặc gạch dưới'),
    password: z
      .string()
      .min(8, 'Mật khẩu tối thiểu 8 ký tự')
      .max(72, 'Mật khẩu tối đa 72 ký tự')
      .regex(/[a-z]/, 'Mật khẩu phải có chữ thường')
      .regex(/[A-Z]/, 'Mật khẩu phải có chữ hoa')
      .regex(/\d/, 'Mật khẩu phải có chữ số')
      .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ký tự đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Bổ sung hồ sơ bệnh nhân khi đăng ký bằng Google lần đầu. */
export const googleProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ và tên').max(100, 'Họ và tên tối đa 100 ký tự'),
  dateOfBirth: z
    .string()
    .min(1, 'Vui lòng chọn ngày sinh')
    .refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) < today(), 'Ngày sinh phải là ngày trong quá khứ')
    .refine((v) => new Date(v).getFullYear() >= 1900, 'Ngày sinh không hợp lệ'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Vui lòng chọn giới tính' }),
  }),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Số điện thoại di động không hợp lệ (VD: 0912345678)'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Bạn cần đồng ý với điều khoản sử dụng và chính sách bảo mật' }),
  }),
});

export type GoogleProfileFormValues = z.infer<typeof googleProfileSchema>;

export const resendEmailSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
});

export type ResendEmailFormValues = z.infer<typeof resendEmailSchema>;
