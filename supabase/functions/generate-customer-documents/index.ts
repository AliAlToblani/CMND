import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DOO Brand Colors
const DOO_PINK = rgb(0.91, 0.47, 0.98);
const DOO_PURPLE = rgb(0.61, 0.53, 0.96);
const DOO_DARK = rgb(0.13, 0.13, 0.13);
const DOO_GRAY = rgb(0.5, 0.5, 0.5);
const DOO_WHITE = rgb(1, 1, 1);

const PRICING_PLANS = [
  { name: "Starter", responses: "5,000", price: "3,000" },
  { name: "Growth", responses: "10,000", price: "5,400" },
  { name: "Pro", responses: "25,000", price: "10,500" },
  { name: "Scale", responses: "50,000", price: "18,000" },
  { name: "Enterprise", responses: "100,000", price: "30,000" },
  { name: "Large Enterprise", responses: "250,000", price: "Custom" }
];

// SIMPLIFIED HEADER - NO OPACITY, NO GRADIENTS
function drawSimpleHeader(page: any, boldFont: any) {
  const { width, height } = page.getSize();
  
  // Solid purple rectangle
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 120,
    color: DOO_PURPLE,
  });
  
  // White text on purple
  page.drawText('DOO', {
    x: 50,
    y: height - 70,
    size: 36,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
}

function drawFooter(page: any, text: string, font: any) {
  const { width } = page.getSize();
  
  page.drawText('DOO Technologies | CR: 173610-1', {
    x: 40,
    y: 30,
    size: 9,
    font: font,
    color: DOO_GRAY,
  });
  
  page.drawText(text, {
    x: width - 150,
    y: 30,
    size: 9,
    font: font,
    color: DOO_GRAY,
  });
}

// MINIMAL TEST VERSION - Single page with simple content
async function generateProposal(customer: any, logoBytes: Uint8Array | null) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([595, 842]);
  
  // Simple header
  drawSimpleHeader(page, boldFont);
  
  // Simple black text
  page.drawText('TEST PROPOSAL', {
    x: 50,
    y: 600,
    size: 24,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Customer: ${customer.name}`, {
    x: 50,
    y: 550,
    size: 14,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: 520,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a minimal test proposal document.', {
    x: 50,
    y: 480,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('If you can see this text, PDF generation is working!', {
    x: 50,
    y: 460,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  return await pdfDoc.save();
}

// MINIMAL TEST VERSION - Single page SLA
async function generateSLA(customer: any, logoBytes: Uint8Array | null) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([595, 842]);
  
  drawSimpleHeader(page, boldFont);
  
  page.drawText('TEST SERVICE LEVEL AGREEMENT', {
    x: 50,
    y: 600,
    size: 22,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`For: ${customer.name}`, {
    x: 50,
    y: 550,
    size: 14,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a minimal test SLA document.', {
    x: 50,
    y: 480,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  return await pdfDoc.save();
}

// MINIMAL TEST VERSION - Single page invoice
async function generateInvoice(customer: any, logoBytes: Uint8Array | null) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const page = pdfDoc.addPage([595, 842]);
  
  drawSimpleHeader(page, boldFont);
  
  page.drawText('TEST INVOICE / QUOTATION', {
    x: 50,
    y: 600,
    size: 22,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Customer: ${customer.name}`, {
    x: 50,
    y: 550,
    size: 14,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  const setupFee = customer.setup_fee || 300;
  const annualRate = customer.annual_rate || 10500;
  const currency = customer.currency || 'BD';
  
  page.drawText(`Setup Fee: ${currency} ${setupFee}`, {
    x: 50,
    y: 500,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Annual Rate: ${currency} ${annualRate}`, {
    x: 50,
    y: 480,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Total: ${currency} ${setupFee + annualRate}`, {
    x: 50,
    y: 450,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { customer_id, document_types, format, options } = await req.json();

    console.log('[EDGE-FUNCTION] Generating documents:', {
      customer_id,
      document_types,
      format,
      options
    });

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error('Customer not found');
    }

    // Skip logo for now - use text-based logo in gradient header
    const logoBytes = null;

    const generatedDocs = [];
    const errors = [];

    for (const docType of document_types) {
      try {
        console.log(`[EDGE-FUNCTION] Generating ${docType}...`);
        
        let pdfBytes;
        switch (docType) {
          case 'proposal':
            pdfBytes = await generateProposal(customer, logoBytes);
            break;
          case 'service_agreement':
            pdfBytes = await generateSLA(customer, logoBytes);
            break;
          case 'sla':
            pdfBytes = await generateSLA(customer, logoBytes);
            break;
          case 'quotation':
            pdfBytes = await generateInvoice(customer, logoBytes);
            break;
          default:
            throw new Error(`Unknown document type: ${docType}`);
        }

        const fileName = `${customer_id}/${docType}_${Date.now()}.pdf`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('customer-documents')
          .upload(fileName, pdfBytes, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get signed URL
        const { data: urlData } = await supabase.storage
          .from('customer-documents')
          .createSignedUrl(fileName, 3600);

        if (!urlData) {
          throw new Error('Failed to generate download URL');
        }

        // Insert record
        const { error: insertError } = await supabase
          .from('generated_documents')
          .insert({
            customer_id,
            document_type: docType,
            file_path: fileName,
            format: 'pdf',
            generated_by: user.id,
            metadata: { options }
          });

        if (insertError) {
          console.error('Error inserting record:', insertError);
        }

        generatedDocs.push({
          type: docType,
          file_path: fileName,
          download_url: urlData.signedUrl,
          generated_at: new Date().toISOString()
        });

        console.log(`[EDGE-FUNCTION] Successfully generated ${docType}`);
        
      } catch (error: any) {
        console.error(`[EDGE-FUNCTION] Error generating ${docType}:`, error);
        errors.push(`Failed to generate ${docType}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: generatedDocs.length > 0,
        documents: generatedDocs,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('[EDGE-FUNCTION] Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        documents: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
