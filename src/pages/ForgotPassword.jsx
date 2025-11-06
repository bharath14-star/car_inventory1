import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import API from '../api'
import { Link } from 'react-router-dom'

export default function ForgotPassword(){
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await API.post('/auth/forgot-password', data);
      setSuccess(res.data.message || 'Password reset instructions sent to your email');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to send reset instructions. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
      {/* Animated background elements */}
      <div className="position-absolute top-0 start-0 w-100 h-100" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)' }}></div>
      <div className="container position-relative">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className={`card shadow-xl border-0 rounded-4 animate__animated ${isVisible ? 'animate__fadeInUp' : ''}`} style={{ backdropFilter: 'blur(10px)', background: 'rgba(255, 255, 255, 0.95)', transition: 'all 0.5s ease' }}>
              <div className="card-body p-5">
                <div className="text-center mb-5">
                  <div className="mb-3">
                    <i className="bi bi-shield-lock-fill display-4 text-primary"></i>
                  </div>
                  <h1 className="fw-bold text-dark mb-3" style={{ fontSize: '2.5rem', background: 'linear-gradient(45deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forgot Password</h1>
                  <h3 className="fw-semibold text-muted mb-2">Reset Your Password</h3>
                  <p className="text-muted small">Enter your email address and we'll send you instructions to reset your password</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label fw-semibold text-dark">Email Address</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="bi bi-envelope-fill text-primary"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 ps-0 shadow-none"
                        id="email"
                        placeholder="Enter your email address"
                        {...register('email')}
                        required
                        style={{ borderLeft: 'none', transition: 'border-color 0.3s ease' }}
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="alert alert-danger border-0 rounded-3 py-3 animate__animated animate__shakeX" role="alert" style={{ background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)', color: 'white' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success border-0 rounded-3 py-3 animate__animated animate__fadeIn" role="alert" style={{ background: 'linear-gradient(45deg, #51cf66, #40c057)', color: 'white' }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      {success}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 fw-semibold rounded-3 shadow-lg position-relative overflow-hidden mb-4"
                    disabled={loading}
                    style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', border: 'none', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <span className="position-relative z-index-1">
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Sending Instructions...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Send Reset Instructions
                        </>
                      )}
                    </span>
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-white opacity-25 rounded-3" style={{ transform: 'translateX(-100%)', transition: 'transform 0.6s ease' }}></div>
                  </button>
                </form>
                <div className="text-center">
                  <Link to="/login" className="text-decoration-none text-primary fw-semibold" style={{ transition: 'color 0.3s ease' }}>
                    <small><i className="bi bi-arrow-left me-1"></i>Back to Login</small>
                  </Link>
                </div>
                <div className="text-center mt-3">
                  <small className="text-muted">Don't have an account? <Link to="/register" className="text-primary fw-semibold text-decoration-none">Sign up</Link></small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
