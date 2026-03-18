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
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('*')
            .order('nome')

        if (error) throw error

        return { success: true, data }

    } catch (error) {
        console.error('getClientes erro:', error)
        return { success: false, data: [] }
    }
}

export async function saveCliente(cliente) {
    try {
        if (cliente.id) {
            const { error } = await supabase
                .from('clientes')
                .update(cliente)
                .eq('id', cliente.id)

            if (error) throw error

            return { success: true, id: cliente.id }

        } else {
            const { data, error } = await supabase
                .from('clientes')
                .insert(cliente)
                .select()
                .single()

            if (error) throw error

            return { success: true, id: data.id }
        }

    } catch (error) {
        console.error('saveCliente erro:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteCliente(id) {
    try {
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true }

    } catch (error) {
        console.error('deleteCliente erro:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// VEICULOS
// ============================================
export async function getVeiculos() {
    try {
        const { data, error } = await supabase
            .from('veiculos')
            .select('*')
            .order('modelo')

        if (error) throw error

        return { success: true, data }

    } catch (error) {
        console.error('getVeiculos erro:', error)
        return { success: false, data: [] }
    }
}

export async function saveVeiculo(veiculo) {
    try {
        if (veiculo.id) {
            const { error } = await supabase
                .from('veiculos')
                .update(veiculo)
                .eq('id', veiculo.id)

            if (error) throw error

            return { success: true, id: veiculo.id }

        } else {
            const { data, error } = await supabase
                .from('veiculos')
                .insert(veiculo)
                .select()
                .single()

            if (error) throw error

            return { success: true, id: data.id }
        }

    } catch (error) {
        console.error('saveVeiculo erro:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteVeiculo(id) {
    try {
        const { error } = await supabase
            .from('veiculos')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true }

    } catch (error) {
        console.error('deleteVeiculo erro:', error)
        return { success: false, error: error.message }
    }
}

// ============================================
// ORDENS DE SERVICO
// ============================================
export async function getOrdensServico() {
    try {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*, os_servicos(*)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data }

    } catch (error) {
        console.error('getOrdensServico erro:', error)
        return { success: false, data: [] }
    }
}

export async function saveOS(os, servicos) {

    let osId = os.id

    try {

        // UPDATE
        if (osId) {
            const { data, error } = await supabase
                .from('ordens_servico')
                .update(os)
                .eq('id', osId)
                .select()

            if (error) throw error

            if (!data || data.length === 0) {
                throw new Error('OS não encontrada para update')
            }

            const { error: deleteError } = await supabase
                .from('os_servicos')
                .delete()
                .eq('os_id', osId)

            if (deleteError) throw deleteError

        } 
        // INSERT
        else {
            const { data, error } = await supabase
                .from('ordens_servico')
                .insert(os)
                .select()
                .single()

            if (error) throw error

            osId = data.id
        }

        // SERVIÇOS
        if (servicos && servicos.length > 0) {
            const payload = servicos.map(s => ({
                descricao: s.descricao,
                valor: s.valor,
                os_id: osId
            }))

            const { error } = await supabase
                .from('os_servicos')
                .insert(payload)

            if (error) throw error
        }

        return { success: true, id: osId }

    } catch (error) {
        console.error('saveOS erro:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteOS(id) {
    try {
        const { error } = await supabase
            .from('ordens_servico')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true }

    } catch (error) {
        console.error('deleteOS erro:', error)
        return { success: false, error: error.message }
    }
}
