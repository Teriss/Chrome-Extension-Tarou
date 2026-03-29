import { code, userInfo } from '~/logic'

async function request<T>(api: string, options?: RequestInit): Promise<T> {
  const baseURL = import.meta.env.VITE_APP_BASE_API
  const { checkCode } = useUser()

  checkCode()

  const defaultOptions = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'code': code.value,
      'uid': userInfo.value.uid || '',
    },
  }

  const fetchOptions = { ...defaultOptions, ...options }
  
  console.log('API请求信息:', {
    url: baseURL + api,
    method: fetchOptions.method,
    headers: fetchOptions.headers,
    body: fetchOptions.body
  })

  try {
    const response = await fetch(baseURL + api, fetchOptions)
    console.log('API响应状态:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('API响应数据:', data)

    if (!response.ok) {
      throw new Error(data.message || `请求失败: ${response.status}`)
    }
    return data
  }
  catch (err) {
    console.error('API请求错误:', err)
    return Promise.reject(err)
  }
}

export default request
