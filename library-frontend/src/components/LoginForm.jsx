import { useState } from 'react'
import { gql } from '@apollo/client'
import { useMutation } from '@apollo/client/react'

const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`

const LoginForm = ({ show, setToken }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)

  const [login] = useMutation(LOGIN)

  if (!show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    setErrorMessage(null)

    try {
      const result = await login({ variables: { username, password } })
      const token = result.data.login.value
      window.localStorage.setItem('library-user-token', token)
      setToken(token)
      setUsername('')
      setPassword('')
    } catch {
      setErrorMessage('login failed')
    }
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          <label>
            username
            <input
              value={username}
              onChange={({ target }) => setUsername(target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            password
            <input
              type="password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
            />
          </label>
        </div>
        <button type="submit">login</button>
      </form>
      {errorMessage && <div>{errorMessage}</div>}
    </div>
  )
}

export default LoginForm
