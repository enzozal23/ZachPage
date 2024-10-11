import { useForm } from "react-hook-form"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import zachAdmin from "../../images/zachAdmin.png"

function LoginPage() {

    const { register, handleSubmit, formState: { errors } } = useForm()
    const { signin, errors: loginErrors, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const onSubmit = handleSubmit(async (data) => {
        setLoading(true) // Empezamos a cargar
        await signin(data) // Esperamos la respuesta del servidor
        setLoading(false) // Detenemos el loading una vez recibida la respuesta
    })

    useEffect(() => {
        if (isAuthenticated) navigate('/products')
    }, [isAuthenticated, navigate])

    return (
        <div className='flex h-[calc(100vh-100px)] items-center justify-center'>
            <div className="bg bg-zinc-900 max-w-md w-full p-10 rounded-md">
                {loginErrors.map((error, index) => (
                    <div key={index} className='bg-red-500 p-2 text-white rounded-md'>{error}</div>
                ))}
                <div className="flex items-center justify-center p-5">
                    <img src={zachAdmin} alt="" />
                </div>
                <form onSubmit={onSubmit}>
                    <input
                        type="email"
                        {...register('email', { required: true })}
                        className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
                        placeholder='Email'
                    />
                    {errors.email && (<p className='text-red-500'>Email is required</p>)}

                    <input
                        type="password"
                        {...register('password', { required: true })}
                        className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
                        placeholder='Password'
                    />
                    {errors.password && (<p className='text-red-500'>Password is required</p>)}

                    <button
                        type='submit'
                        className={`w-full bg-sky-500 text-white px-4 py-2 rounded-md mt-4 flex items-center justify-center ${loading ? 'opacity-50' : ''}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        ) : 'Login'}
                    </button>
                </form>

                {/* <p className="flex gap-x-2 justify-between mt-4">Don't have an account?
                    <Link className="text-sky-500" to='/register'>Sign up</Link>
                </p> */}
            </div>
        </div>
    )
}

export default LoginPage
