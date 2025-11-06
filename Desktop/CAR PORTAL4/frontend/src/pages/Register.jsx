import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import API from '../api'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const { register, handleSubmit, watch } = useForm();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const res = await API.post('/auth/register', data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Register failed');
    }
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-8 col-lg-6 col-xl-4">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary mb-2">Create Account</h2>
                <p className="text-muted">Join our car portal community</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">First Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg border-0 bg-light"
                      placeholder="Enter first name"
                      {...register('firstName')}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Last Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg border-0 bg-light"
                      placeholder="Enter last name"
                      {...register('lastName')}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-lg border-0 bg-light"
                    placeholder="Enter your email"
                    {...register('email')}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control form-control-lg border-0 bg-light"
                    placeholder="Enter phone number"
                    {...register('phone')}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <div className="input-group input-group-lg">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control border-0 bg-light"
                      placeholder="Create a password"
                      {...register('password')}
                      required
                    />
                    <span
                      className="input-group-text border-0 bg-light"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Confirm Password</label>
                  <div className="input-group input-group-lg">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control border-0 bg-light"
                      placeholder="Confirm your password"
                      {...register('confirmPassword')}
                      required
                    />
                    <span
                      className="input-group-text border-0 bg-light"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 fw-bold py-3 rounded-3 mb-3"
                >
                  Create Account
                </button>

                <div className="text-center">
                  <span className="text-muted">Already have an account? </span>
                  <a href="/login" className="text-primary text-decoration-none fw-semibold">
                    Sign in here
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
