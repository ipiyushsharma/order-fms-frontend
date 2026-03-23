import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../utils/api'

export function useOrders(filter = 'all', search = '') {
  const [orders, setOrders]   = useState([])
  const [total, setTotal]     = useState(0)
  const [cxRejected, setCxRejected] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const intervalRef           = useRef(null)

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filter !== 'all') params.filter = filter
      if (search.trim())    params.search  = search.trim()
      const res = await api.get('/orders', { params })
      setOrders(res.data.orders)
      setTotal(res.data.total)
      setCxRejected(res.data.cxRejected || 0)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch orders')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    fetchOrders()
    intervalRef.current = setInterval(() => fetchOrders(true), 8000)
    return () => clearInterval(intervalRef.current)
  }, [fetchOrders])

  const createOrder = useCallback(async (data) => {
    const res = await api.post('/orders', data)
    await fetchOrders(true)
    return res.data
  }, [fetchOrders])

  const updateOrder = useCallback(async (id, data) => {
    const res = await api.patch(`/orders/${id}`, data)
    await fetchOrders(true)
    return res.data
  }, [fetchOrders])

  const deleteOrder = useCallback(async (id) => {
    await api.delete(`/orders/${id}`)
    await fetchOrders(true)
  }, [fetchOrders])

  return { orders, total, cxRejected, loading, error, refetch: fetchOrders, createOrder, updateOrder, deleteOrder }
}

export function useLogs() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/logs?limit=150')
      setLogs(res.data.logs)
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  return { logs, loading, refetch: fetchLogs }
}

export function useHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/history')
      setHistory(res.data.history || [])
    } catch (err) {
      console.error('History fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, loading, refetch: fetchHistory }
}