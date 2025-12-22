import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import API from '../api'

export default function ForgotPassword() {
  const { register, handleSubmit } = useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (data) => {
    if (submitted) return
    setLoading(true)
    setError('')
    setSuccess('')
    setSubmitted(true)
    try {
      const res = await API.post('/auth/forgot-password', data)
      setSuccess(res.data.message || 'Password reset instructions sent to your email')
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to send reset instructions. Please try again.')
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  // Sports-themed background image from a free source
  const backgroundImage = 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1470&q=80'  // Mercedes-Benz car image

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      />
      {/* Centered form container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '2rem 3rem',
          width: '100%',
          maxWidth: '400px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <input
            type="email"
            placeholder="Enter your email address"
            {...register('email')}
            required
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              marginBottom: '1.25rem',
              outline: 'none',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              transition: 'border-color 0.3s ease',
              width: '100%',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#667eea')}
            onBlur={(e) => (e.target.style.borderColor = '#ccc')}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              padding: '0.75rem 1rem',
              fontSize: '1.1rem',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 8px rgba(102, 126, 234, 0.5)',
              transition: 'background-color 0.3s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#556cd6'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#667eea'
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>
      </div>
    </div>
  )
}
