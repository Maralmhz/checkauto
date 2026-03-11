// ============================================
// SUPABASE CLIENT
// ============================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://hefpzigrxyyhvtgkyspr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Af0DdLvEB9NuDE69aIPr_w_3a55KPLk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ============================================
// CLIENTES
// ============================================
export async function getClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('nome')
    if (error) { console.error(error); return [] }
    return data
}

export async function saveCliente(cliente) {
    if (cliente.id) {
        const { error } = await supabase.from('clientes').update(cliente).eq('id', cliente.id)
        if (error) throw error
    } else {
        const { error } = await supabase.from('clientes').insert(cliente)
        if (error) throw error
    }
}

export async function deleteCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
}

// ============================================
// VEICULOS
// ============================================
export async function getVeiculos() {
    const { data, error } = await supabase.from('veiculos').select('*').order('modelo')
    if (error) { console.error(error); return [] }
    return data
}

export async function saveVeiculo(veiculo) {
    if (veiculo.id) {
        const { error } = await supabase.from('veiculos').update(veiculo).eq('id', veiculo.id)
        if (error) throw error
    } else {
        const { error } = await supabase.from('veiculos').insert(veiculo)
        if (error) throw error
    }
}

export async function deleteVeiculo(id) {
    const { error } = await supabase.from('veiculos').delete().eq('id', id)
    if (error) throw error
}

// ============================================
// ORDENS DE SERVICO
// ============================================
export async function getOrdensServico() {
    const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, os_servicos(*)')
        .order('created_at', { ascending: false })
    if (error) { console.error(error); return [] }
    return data
}

export async function saveOS(os, servicos) {
    if (os.id) {
        const { error } = await supabase.from('ordens_servico').update(os).eq('id', os.id)
        if (error) throw error
        await supabase.from('os_servicos').delete().eq('os_id', os.id)
    } else {
        const { error } = await supabase.from('ordens_servico').insert(os)
        if (error) throw error
    }
    if (servicos.length > 0) {
        const { error } = await supabase.from('os_servicos').insert(
            servicos.map(s => ({ descricao: s.descricao, valor: s.valor, os_id: os.id }))
        )
        if (error) throw error
    }
}

export async function deleteOS(id) {
    const { error } = await supabase.from('ordens_servico').delete().eq('id', id)
    if (error) throw error
}
