#!/bin/bash

# Test script para testar apenas o MCP endpoint
# Uso: ./test-mcp.sh [url] [topico]
# Exemplo: ./test-mcp.sh https://research-mcp-production-f34c.up.railway.app "IA em FSI"

URL="${1:-https://research-mcp-production-f34c.up.railway.app}"
TOPIC="${2:-teste do MCP}"

echo "🧪 Testando MCP: $URL"
echo "📝 Tópico: $TOPIC"
echo ""

# Test 1: Health check
echo "1️⃣  Teste de Health Check..."
HEALTH=$(curl -s "$URL/" | jq '.status' 2>/dev/null)
if [ "$HEALTH" = '"ok"' ]; then
  echo "   ✅ Servidor respondendo"
else
  echo "   ❌ Servidor não respondendo"
  exit 1
fi
echo ""

# Test 2: MCP Initialize
echo "2️⃣  Teste de MCP Initialize..."
INIT=$(curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  2>/dev/null | grep -o '"protocolVersion"')

if [ ! -z "$INIT" ]; then
  echo "   ✅ MCP Initialize funcionando"
else
  echo "   ❌ MCP Initialize falhou"
  exit 1
fi
echo ""

# Test 3: Tools List
echo "3️⃣  Teste de Tools List..."
TOOLS=$(curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  2>/dev/null | grep -o '"name":"search"')

if [ ! -z "$TOOLS" ]; then
  echo "   ✅ Ferramenta 'search' disponível"
else
  echo "   ❌ Ferramenta 'search' não encontrada"
  exit 1
fi
echo ""

# Test 4: Search Tool Call
echo "4️⃣  Teste de Search Tool..."
SEARCH=$(curl -s -X POST "$URL/mcp" \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"search\",\"arguments\":{\"topic\":\"$TOPIC\",\"context\":\"teste\"}}}" \
  2>/dev/null | grep -o '"type":"text"')

if [ ! -z "$SEARCH" ]; then
  echo "   ✅ Search tool retornou resposta"
  echo ""
  echo "📊 Resultado (primeiras 500 caracteres):"
  echo "---"
  curl -s -X POST "$URL/mcp" \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"search\",\"arguments\":{\"topic\":\"$TOPIC\",\"context\":\"teste\"}}}" \
    2>/dev/null | grep -o 'data: {.*' | jq '.result.content[0].text' 2>/dev/null | head -c 500
  echo ""
  echo "---"
else
  echo "   ❌ Search tool falhou"
  exit 1
fi
echo ""

echo "✅ Todos os testes passaram!"
echo ""
echo "O MCP está pronto para usar no Claude!"
