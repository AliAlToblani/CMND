import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentGenerationRequest {
  customer_id: string;
  document_types: Array<'proposal' | 'service_agreement' | 'sla' | 'quotation'>;
  format: 'pdf';
  options?: {
    include_logo?: boolean;
    custom_fields?: Record<string, any>;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[DOC-GEN] Function invoked, method:', req.method);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('[DOC-GEN] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[DOC-GEN] Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('[DOC-GEN] User authenticated:', user.id);

    const requestBody: DocumentGenerationRequest = await req.json();
    const { customer_id, document_types, options } = requestBody;

    console.log('[DOC-GEN] Request params:', { customer_id, document_types, options });

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      console.error('[DOC-GEN] Customer fetch error:', customerError);
      throw new Error('Customer not found');
    }

    console.log('[DOC-GEN] Customer found:', customer.name);

    // For now, return a simple success response
    // TODO: Add actual PDF generation
    const mockResults = document_types.map(docType => ({
      type: docType,
      file_path: `${customer_id}/${docType}_mock.pdf`,
      download_url: `https://example.com/mock/${docType}.pdf`,
      generated_at: new Date().toISOString(),
      note: 'Mock document - PDF generation coming soon'
    }));

    return new Response(
      JSON.stringify({
        success: true,
        documents: mockResults,
        message: 'Edge function is working. PDF generation will be implemented next.',
        customer: {
          id: customer.id,
          name: customer.name
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[DOC-GEN] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        documents: [],
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});