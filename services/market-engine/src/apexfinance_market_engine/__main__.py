import json

from apexfinance_market_engine.health import get_engine_status


def main() -> None:
    status = get_engine_status()

    print(
        json.dumps(
            status,
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()