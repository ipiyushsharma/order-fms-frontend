import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { canDo } from '../../utils/helpers'
import { X, Package, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const VIA_OPTIONS        = ['WhatsApp', 'Phone', 'Email', 'Direct', 'Other']
const RECEIVER_OPTIONS   = ['Priya S', 'Amit V', 'Vikram S', 'Other']
const PAY_MODE_OPTIONS   = ['', 'Bank Transfer', 'Cash', 'Cheque', 'UPI', 'Credit']
const CONFIRM_OPTIONS    = ['Pending', 'Confirmed', 'Rejected']
const PAY_STATUS_OPTIONS = ['Pending', 'Partial', 'Paid']
const PACK_OPTIONS       = ['Not Started', 'In Progress', 'Completed']
const DISP_OPTIONS       = ['Pending', 'Complete']
const BILL_OPTIONS       = ['Pending', 'Generated']
const BILTY_OPTIONS      = ['Pending', 'Created']
const LEDGER_OPTIONS     = ['No', 'Yes']
const PRODUCT_OPTIONS    = ['Wire', 'McB', 'Light', 'Fan', 'Modular', 'Non Modular', 'Other']

function Field({ label, children, disabled }) {
  return (
    <div className={clsx('flex flex-col gap-1', disabled && 'opacity-50')}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

function SelectField({ name, value, options, onChange, disabled }) {
  return (
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      disabled={disabled}
      className={clsx('select-input', disabled && 'cursor-not-allowed')}
    >
      {options.map(o => <option key={o} value={o}>{o || 'Select…'}</option>)}
    </select>
  )
}

function parseProducts(productName) {
  if (!productName) return [{ name: '' }]
  return productName.split('|').map(n => ({ name: n.trim() }))
}

function stringifyProducts(products) {
  const valid = products.filter(p => p.name.trim())
  return valid.map(p => p.name.trim()).join('|')
}

export default function OrderFormModal({ order, onClose, onSave }) {
  const { user } = useAuth()
  const role    = user?.role
  const isEdit  = !!order
  const isAdmin = role === 'admin'

  const can = {
    basic:    canDo(role, 'update_basic') || isAdmin,
    estimate: canDo(role, 'update_estimate') || isAdmin,
    payment:  canDo(role, 'update_payment') || isAdmin,
    packing:  canDo(role, 'update_packing') || isAdmin,
    dispatch: canDo(role, 'update_dispatch') || isAdmin,
  }

  const [form, setForm] = useState({
    partyName: '', contactNumber: '', orderVia: 'WhatsApp',
    paymentMode: '', estimateSent: 'No', customerConfirmation: 'Pending',
    paymentStatus: 'Pending', packingStatus: 'Not Started', dispatchStatus: 'Pending',
    dispatchDate: '', billStatus: 'Pending', biltyStatus: 'Pending', ledgerUpdated: 'No',
    orderCreatedBy: '', estimateSentBy: '', dispatchedBy: '', transportName: '',
    ...(order || {}),
  })

  const [products, setProducts] = useState(() => parseProducts(order?.productName))
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function onChange(e) { set(e.target.name, e.target.value) }

  function addProduct() { setProducts(p => [...p, { name: '' }]) }
  function removeProduct(i) { setProducts(p => p.filter((_, idx) => idx !== i)) }
  function updateProduct(i, value) {
    setProducts(p => p.map((item, idx) => idx === i ? { name: value } : item))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.partyName.trim())     { toast.error('Party name is required'); return }
    if (!form.contactNumber.trim()) { toast.error('Contact number is required'); return }

    const needsProductValidation = !isEdit || can.basic
    if (needsProductValidation && !products.some(p => p.name.trim())) {
      toast.error('Kam se kam ek product select karo')
      return
    }

    const productData = {}
    if (needsProductValidation) {
      productData.productName = stringifyProducts(products)
      productData.quantity    = ''
    }

    setSaving(true)
    try {
      await onSave({ ...form, ...productData })
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box w-full max-w-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
              <Package size={15} className="text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {isEdit ? `Edit ${order.orderId}` : 'New Order'}
              </h2>
              {isEdit && <p className="text-xs text-gray-500">{order.partyName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">

            {/* ── CRR: Products ── */}
            {(!isEdit || can.basic) && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</p>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-200 transition-all"
                  >
                    <Plus size={12} />
                    Add Product
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="label">Product</label>
                  {products.map((product, i) => (
                    <div key={i} className="grid grid-cols-[1fr_32px] gap-2 items-center">
                      <select
                        className="select-input"
                        value={product.name}
                        onChange={e => updateProduct(i, e.target.value)}
                        disabled={isEdit && !can.basic}
                      >
                        <option value="">Select product…</option>
                        {PRODUCT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {products.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeProduct(i)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                          disabled={isEdit && !can.basic}
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : <div />}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── CRR: Order Info ── */}
            {(!isEdit || can.basic) && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Info</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Party Name">
                    <input name="partyName" value={form.partyName} onChange={onChange} className="input" placeholder="Company or individual" disabled={isEdit && !can.basic} required />
                  </Field>
                  <Field label="Contact Number">
                    <input name="contactNumber" value={form.contactNumber} onChange={onChange} className="input" placeholder="Mobile number" disabled={isEdit && !can.basic} required />
                  </Field>
                  <Field label="Order Via">
                    <SelectField name="orderVia" value={form.orderVia} options={VIA_OPTIONS} onChange={onChange} disabled={isEdit && !can.basic} />
                  </Field>
                  {/* Order Created By — LAST */}
                  <Field label="Order Created By">
                    <input name="orderCreatedBy" value={form.orderCreatedBy} onChange={onChange} className="input" placeholder="Enter your name" disabled={isEdit && !can.basic} />
                  </Field>
                </div>
              </section>
            )}

            {/* ── Accounts: Estimate ── */}
            {isEdit && can.estimate && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Estimate & Confirmation</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Order Created By — read only */}
                  <Field label="Order Created By">
                    <input value={form.orderCreatedBy || '—'} className="input cursor-not-allowed" style={{ background: '#f9fafb', color: '#6b7280' }} disabled readOnly />
                  </Field>
                  {/* Products — read only */}
                  <Field label="Products Ordered">
                    <input
                      value={form.productName ? form.productName.split('|').filter(p=>p.trim()).join(', ') : '—'}
                      className="input cursor-not-allowed"
                      style={{ background: '#f9fafb', color: '#6b7280' }}
                      disabled readOnly
                    />
                  </Field>
                  <Field label="Estimate Sent">
                    <SelectField name="estimateSent" value={form.estimateSent} options={['No', 'Yes']} onChange={onChange} />
                  </Field>
                  <Field label="Customer Confirmation" disabled={!can.payment}>
                    <SelectField name="customerConfirmation" value={form.customerConfirmation} options={CONFIRM_OPTIONS} onChange={onChange} disabled={!can.payment} />
                  </Field>
                  {/* Estimate Sent By — LAST */}
                  <Field label="Estimate Sent By">
                    <input name="estimateSentBy" value={form.estimateSentBy} onChange={onChange} className="input" placeholder="Enter your name" />
                  </Field>
                </div>
                {form.customerConfirmation === 'Rejected' && (
                  <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                    ⚠ CX Rejected 
                  </div>
                )}
              </section>
            )}

            {/* ── Accounts: Payment ── */}
            {isEdit && can.payment && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Payment</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Payment Mode">
                    <SelectField name="paymentMode" value={form.paymentMode} options={PAY_MODE_OPTIONS} onChange={onChange} />
                  </Field>
                  <Field label="Payment Status">
                    <SelectField name="paymentStatus" value={form.paymentStatus} options={PAY_STATUS_OPTIONS} onChange={onChange} />
                  </Field>
                </div>
              </section>
            )}

            {/* ── Dispatch ── */}
            {isEdit && can.dispatch && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Packing & Dispatch</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Estimate Sent By — read only */}
                  <Field label="Estimate Sent By">
                    <input value={form.estimateSentBy || '—'} className="input cursor-not-allowed" style={{ background: '#f9fafb', color: '#6b7280' }} disabled readOnly />
                  </Field>
                  <div />
                  <Field label="Packing Status" disabled={!can.packing}>
                    <SelectField name="packingStatus" value={form.packingStatus} options={PACK_OPTIONS} onChange={onChange} disabled={!can.packing} />
                  </Field>
                  <Field label="Dispatch Status">
                    <SelectField name="dispatchStatus" value={form.dispatchStatus} options={DISP_OPTIONS} onChange={onChange} />
                  </Field>
                  <Field label="Bill Status">
                    <SelectField name="billStatus" value={form.billStatus} options={BILL_OPTIONS} onChange={onChange} />
                  </Field>
                  <Field label="Bilty Status">
                    <SelectField name="biltyStatus" value={form.biltyStatus} options={BILTY_OPTIONS} onChange={onChange} />
                  </Field>
                  <Field label="Ledger Updated">
                    <SelectField name="ledgerUpdated" value={form.ledgerUpdated} options={LEDGER_OPTIONS} onChange={onChange} />
                  </Field>
                  <Field label="Transport Name">
                    <input name="transportName" value={form.transportName} onChange={onChange} className="input" placeholder="Transport" />
                  </Field>
                  {/* Dispatched By — LAST */}
                  <Field label="Dispatched By">
                    <input name="dispatchedBy" value={form.dispatchedBy} onChange={onChange} className="input" placeholder="Enter your name" />
                  </Field>
                </div>
                {form.dispatchStatus === 'Complete' && (
                  <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                    
                  </div>
                )}
              </section>
            )}

            {/* ── Admin ── */}
            {isEdit && isAdmin && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Admin Fields</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ledger Updated">
                    <SelectField name="ledgerUpdated" value={form.ledgerUpdated} options={LEDGER_OPTIONS} onChange={onChange} />
                  </Field>
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="btn">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isEdit ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}