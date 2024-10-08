import { useForm } from "react-hook-form"
import { useAuth } from "../context/AuthContext"
import { Link, useNavigate } from "react-router-dom"
import { useEffect } from "react"


function LoginPage() {

    const { register, handleSubmit, formState: { errors } } = useForm()
    const { signin, errors: loginErrors, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const onSubmit = handleSubmit(data => { signin(data) })

    useEffect(() => {
        if (isAuthenticated) navigate('/tasks')
    }, [isAuthenticated])


    return (
        <div className=' flex h-[calc(100vh-100px)] items-center justify-center'>
            <div className="bg bg-zinc-900 max-w-md w-full p-10 rounded-md">
                {loginErrors.map((error) => (<div className='bg-red-500 p-2 text-white rounded-md'>{error}</div>))}
                <h1 className="text-2xl font-bold">login</h1>
                <form onSubmit={onSubmit}>
                    <input type="email" {...register('email', { required: true })}
                        className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
                        placeholder='email'
                    />
                    {errors.email && (<p className='text-red-500'>Email is required</p>)}
                    <input type="password" {...register('password', { required: true })}
                        className='w-full bg-zinc-700 text-white px-4 py-2 rounded-md my-2'
                        placeholder='password' />
                    {errors.password && (<p className='text-red-500'>Password is required</p>)}
                    <button type='submit'>login</button>
                </form>
                <p className="flex gap-x-2 justify-between ">Don't have an account?
                    <Link className="text-sky-500" to='/register'>Sing up</Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage
