from apexfinance_market_engine.health import get_engine_status


def test_retorna_status_operacional_do_motor():
    status = get_engine_status()

    assert status == {
        "status": "operacional",
        "servico": "apexfinance-market-engine",
    }