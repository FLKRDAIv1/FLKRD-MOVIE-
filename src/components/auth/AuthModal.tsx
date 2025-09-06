"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  X, 
  Film,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: 'signin' | 'signup';
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false
};

export const AuthModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  defaultTab = 'signin'
}: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when tab changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setFormData(initialFormData);
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, defaultTab]);

  // Real-time validation
  const validateField = useCallback((field: keyof FormData, value: string) => {
    switch (field) {
      case 'name':
        if (activeTab === 'signup' && !value.trim()) {
          return 'Name is required';
        }
        if (activeTab === 'signup' && value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        return '';
      
      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      
      case 'password':
        if (!value) {
          return 'Password is required';
        }
        if (activeTab === 'signup' && value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return '';
      
      case 'confirmPassword':
        if (activeTab === 'signup' && !value) {
          return 'Please confirm your password';
        }
        if (activeTab === 'signup' && value !== formData.password) {
          return 'Passwords do not match';
        }
        return '';
      
      default:
        return '';
    }
  }, [activeTab, formData.password]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (typeof value === 'string') {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
      
      // Validate confirm password when password changes
      if (field === 'password' && activeTab === 'signup' && formData.confirmPassword) {
        const confirmError = validateField('confirmPassword', formData.confirmPassword);
        setErrors(prev => ({ ...prev, confirmPassword: confirmError || undefined }));
      }
    }
  }, [validateField, activeTab, formData.confirmPassword]);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    
    if (activeTab === 'signup') {
      newErrors.name = validateField('name', formData.name);
    }
    
    newErrors.email = validateField('email', formData.email);
    newErrors.password = validateField('password', formData.password);
    
    if (activeTab === 'signup') {
      newErrors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    }

    // Remove empty error messages
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof FormErrors]) {
        delete newErrors[key as keyof FormErrors];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [activeTab, formData, validateField]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        callbackURL: "/"
      });

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        return;
      }

      toast.success("Welcome back!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password
      });

      if (error?.code) {
        const errorMap: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered. Please sign in instead."
        };
        toast.error(errorMap[error.code] || "Registration failed. Please try again.");
        return;
      }

      toast.success("Account created! Please check your email to verify.");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    if (activeTab === 'signin') {
      await handleSignIn();
    } else {
      await handleSignUp();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(20px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            className="absolute inset-0 bg-black/60"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md glass-card rounded-xl p-8 shadow-2xl"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4 text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-netflix-red/20 p-3">
                  <Film className="h-8 w-8 text-netflix-red" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">
                Welcome to FLKRD
              </h2>
              <p className="mt-2 text-white/60">
                {activeTab === 'signin' 
                  ? 'Sign in to your account' 
                  : 'Create your account'
                }
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex rounded-lg bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className="relative flex-1 rounded-md py-2 text-sm font-medium transition-all"
              >
                <motion.div
                  variants={tabVariants}
                  animate={activeTab === 'signin' ? 'active' : 'inactive'}
                  className="relative z-10 text-white"
                >
                  Sign In
                </motion.div>
                {activeTab === 'signin' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-md bg-netflix-red"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className="relative flex-1 rounded-md py-2 text-sm font-medium transition-all"
              >
                <motion.div
                  variants={tabVariants}
                  animate={activeTab === 'signup' ? 'active' : 'inactive'}
                  className="relative z-10 text-white"
                >
                  Sign Up
                </motion.div>
                {activeTab === 'signup' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-md bg-netflix-red"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {activeTab === 'signup' && (
                  <motion.div
                    key="name-field"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-white/80">
                      Full Name
                    </Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-netflix-red ${
                          errors.name ? 'border-red-500' : ''
                        }`}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-netflix-red ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white/80">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={activeTab === 'signin' ? "current-password" : "new-password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-netflix-red ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              <AnimatePresence>
                {activeTab === 'signup' && (
                  <motion.div
                    key="confirm-password-field"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-white/80">
                      Confirm Password
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-netflix-red ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {activeTab === 'signin' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => 
                      handleInputChange('rememberMe', checked === true)
                    }
                    className="border-white/20 data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red"
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-white/80 cursor-pointer"
                  >
                    Remember me
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-netflix-red hover:bg-netflix-red/90 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {activeTab === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  activeTab === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-white/60">
              {activeTab === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signup')}
                    className="text-netflix-red hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Sign up here
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="text-netflix-red hover:underline font-medium"
                    disabled={isLoading}
                  >
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};