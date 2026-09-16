def get_engine_status() -> dict[str, str]:
    """
    Retorna o estado básico do motor de mercado.

    Este health check confirma que o serviço Python está carregando
    corretamente antes da integração com provedores externos.
    """

    return {
        "status": "operacional",
        "servico": "apexfinance-market-engine",
    }